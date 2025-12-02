import React, { useState, useEffect } from 'react';
import { Entity, InvoiceData, Product, Step, ConfigData, InvoiceStatus } from '../types';
import { EntityForm } from './EntityForm';
import { ProductForm } from './ProductForm';
import { ConfigForm } from './ConfigForm';
import { RegistryManager } from './RegistryManager';
import { ProductSelector } from './ProductSelector';
import { InvoiceHistory } from './InvoiceHistory';
import { ProfileSelector } from './ProfileSelector';
import { PaymentAndObsForm } from './PaymentAndObsForm';
import { Danfe } from './Danfe';
import { generateNfeXml, generateAccessKey } from '../services/xmlGenerator';
import { validateCNPJ, validateRequired } from '../utils/validators';
import { calculateInvoiceTotals } from '../utils/taxCalculations';
import { db } from '../services/storage';
import { FileText, Users, ShoppingCart, Send, ArrowRight, ArrowLeft, Download, CheckCircle, Shield, Settings, Loader2, AlertCircle, LayoutDashboard, Box, Search, History, Printer, Building2, LogOut, CreditCard, Save } from 'lucide-react';
import { Municipio } from '../types';

const initialEntity: Entity = {
  cnpj: '',
  razaoSocial: '',
  inscricaoEstadual: '',
  endereco: {
    logradouro: '', numero: '', bairro: '', municipio: '', codigoIbge: '', uf: '', cep: ''
  },
  crt: '1' // Default Simples Nacional
};

type ViewMode = 'dashboard' | 'issuers' | 'recipients' | 'products' | 'invoice' | 'history';

interface NFeModuleProps {
    externalData: Municipio[];
}

const NFeModule: React.FC<NFeModuleProps> = ({ externalData }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [currentStep, setCurrentStep] = useState<Step>(Step.CONFIG);
  
  const [activeProfile, setActiveProfile] = useState<Entity | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [profilesList, setProfilesList] = useState<Entity[]>([]);
  const [invoiceCount, setInvoiceCount] = useState<number>(0);

  // Flatten external data into Products
  const [externalProducts, setExternalProducts] = useState<Product[]>([]);

  useEffect(() => {
      const loadProfiles = async () => {
          const profiles = await db.get<Entity>('issuers');
          setProfilesList(profiles);
          
          const savedProfileId = localStorage.getItem('nfe_active_profile_id');
          if (savedProfileId) {
              const found = profiles.find(p => p.id === savedProfileId);
              if (found) {
                  setActiveProfile(found);
              } else {
                  setShowProfileSelector(true);
              }
          } else {
              setShowProfileSelector(true);
          }
      };
      loadProfiles();
  }, []);

  useEffect(() => {
      const loadStats = async () => {
          if (activeProfile) {
              const allInvoices = await db.get<InvoiceData>('invoices');
              const count = allInvoices.filter(i => i.emitente.cnpj.replace(/\D/g,'') === activeProfile.cnpj.replace(/\D/g,'')).length;
              setInvoiceCount(count);
          }
      };
      loadStats();
  }, [activeProfile]);

  useEffect(() => {
      if (externalData) {
          const flatProducts: Product[] = [];
          externalData.forEach(mun => {
              mun.editais.forEach(ed => {
                  ed.itens.forEach(item => {
                      flatProducts.push({
                          id: item.id,
                          codigo: item.id.substring(0, 8), // Gera código simples
                          descricao: `${item.descricao} (${item.marca || 'GEN'})`,
                          gtin: 'SEM GTIN',
                          ncm: '', // Dados da Intranet não tem NCM
                          cfop: '', // Dados da Intranet não tem CFOP
                          unidade: item.unidade,
                          quantidade: 1,
                          valorUnitario: item.valorUnitario,
                          valorTotal: item.valorUnitario,
                          tax: { // Default tax
                              origem: '0', 
                              baseCalculoIcms: 0, aliquotaIcms: 0, valorIcms: 0,
                              cstPis: '07', baseCalculoPis: 0, aliquotaPis: 0, valorPis: 0,
                              cstCofins: '07', baseCalculoCofins: 0, aliquotaCofins: 0, valorCofins: 0,
                              cstIpi: '53', baseCalculoIpi: 0, aliquotaIpi: 0, valorIpi: 0,
                              cst: '00', csosn: '102', codigoEnquadramento: '999'
                          }
                      });
                  });
              });
          });
          setExternalProducts(flatProducts);
      }
  }, [externalData]);

  const [config, setConfig] = useState<ConfigData>({
    ambiente: '2', 
    proximoNumeroNota: '1001',
    serie: '1',
    certificado: null,
    senhaCertificado: ''
  });

  const [invoice, setInvoice] = useState<InvoiceData>({
    numero: '1001',
    serie: '1',
    dataEmissao: new Date().toISOString().split('T')[0],
    emitente: { ...initialEntity },
    destinatario: { ...initialEntity },
    produtos: [],
    // New Totals Object
    totais: { vBC:0, vICMS:0, vProd:0, vFrete:0, vSeg:0, vDesc:0, vIPI:0, vPIS:0, vCOFINS:0, vOutro:0, vNF:0 },
    globalValues: { frete: 0, seguro: 0, desconto: 0, outrasDespesas: 0, modalidadeFrete: '9' },
    pagamento: [],
    informacoesComplementares: '',
    finalidade: '1',
    status: 'editing'
  });

  const [xmlPreview, setXmlPreview] = useState<string>('');
  const [status, setStatus] = useState<InvoiceStatus>('editing');
  const [eventProcessing, setEventProcessing] = useState<string | null>(null); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<InvoiceData | null>(null);
  const [savedRecipients, setSavedRecipients] = useState<Entity[]>([]);

  // Load recipients when entering recipient step
  useEffect(() => {
      if (currentStep === Step.DESTINATARIO) {
          const fetchRecipients = async () => {
              const res = await db.get<Entity>('recipients');
              setSavedRecipients(res);
          };
          fetchRecipients();
      }
  }, [currentStep]);

  useEffect(() => {
    if (activeProfile) {
        localStorage.setItem('nfe_active_profile_id', activeProfile.id!);
        if (status === 'editing') {
            setInvoice(prev => ({ ...prev, emitente: activeProfile }));
        }
        setShowProfileSelector(false);
    }
  }, [activeProfile, status]);

  useEffect(() => {
    if (status === 'editing') {
        setInvoice(prev => ({
            ...prev,
            numero: config.proximoNumeroNota,
            serie: config.serie
        }));
    }
  }, [config.proximoNumeroNota, config.serie, status]);

  useEffect(() => {
    // Recalculate totals whenever products or global values change
    const newTotals = calculateInvoiceTotals(invoice.produtos, invoice.globalValues);
    
    setInvoice(prev => ({
      ...prev,
      totais: newTotals,
    }));
  }, [invoice.produtos, invoice.globalValues]);

  useEffect(() => {
    if (currentStep === Step.EMISSAO && viewMode === 'invoice' && status === 'editing') {
      const accessKey = generateAccessKey(invoice, config.ambiente);
      const xml = generateNfeXml({ ...invoice, chaveAcesso: accessKey }, config.ambiente);
      setInvoice(prev => ({ ...prev, chaveAcesso: accessKey, xmlAssinado: xml }));
      setXmlPreview(xml);
    }
  }, [currentStep, invoice.produtos, invoice.destinatario, invoice.emitente, invoice.pagamento, invoice.informacoesComplementares, invoice.globalValues, config.ambiente, viewMode, status]);

  const handleProfileSelect = (profile: Entity) => {
      setActiveProfile(profile);
      setViewMode('dashboard');
  };

  const handleCreateProfile = () => {
      setViewMode('issuers');
      setShowProfileSelector(false);
  };

  const handleLogoutProfile = () => {
      setActiveProfile(null);
      localStorage.removeItem('nfe_active_profile_id');
      setShowProfileSelector(true);
  };

  const validateStep = (): boolean => {
    setErrorMsg(null);
    if (currentStep === Step.CONFIG) {
        if (!config.proximoNumeroNota || !config.serie) {
            setErrorMsg("Defina o número e a série da nota.");
            return false;
        }
    }
    if (currentStep === Step.EMITENTE) {
        if (invoice.emitente.id !== activeProfile?.id) {
             setErrorMsg("O emitente deve corresponder ao Perfil Ativo.");
             return false;
        }
        if (!validateCNPJ(invoice.emitente.cnpj)) {
            setErrorMsg("CNPJ do Emitente inválido.");
            return false;
        }
        if (!invoice.emitente.endereco.codigoIbge || invoice.emitente.endereco.codigoIbge.length !== 7) {
             setErrorMsg("Código IBGE do município é obrigatório.");
             return false;
        }
    }
    if (currentStep === Step.DESTINATARIO) {
        if (!validateCNPJ(invoice.destinatario.cnpj)) {
            setErrorMsg("CNPJ do Destinatário inválido.");
            return false;
        }
        if (!validateRequired(invoice.destinatario.razaoSocial)) {
             setErrorMsg("Preencha a Razão Social do Destinatário.");
             return false;
        }
    }
    if (currentStep === Step.PRODUTOS) {
        if (invoice.produtos.length === 0) {
            setErrorMsg("Adicione pelo menos um produto.");
            return false;
        }
    }
    if (currentStep === Step.PAGAMENTO) {
        const totalPag = invoice.pagamento.reduce((acc: number, p: any) => acc + p.vPag, 0);
        if (Math.abs(totalPag - invoice.totais.vNF) > 0.01) {
            setErrorMsg(`Total dos pagamentos (R$ ${totalPag.toFixed(2)}) difere do total da nota (R$ ${invoice.totais.vNF.toFixed(2)}).`);
            return false;
        }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep() && currentStep < Step.EMISSAO) {
        setCurrentStep(currentStep + 1);
        setErrorMsg(null);
    }
  };

  const handleBack = () => {
    if (currentStep > Step.CONFIG) {
        setCurrentStep(currentStep - 1);
        setErrorMsg(null);
    }
  };

  const addProduct = (product: Product) => {
    setInvoice(prev => ({
      ...prev,
      produtos: [...prev.produtos, product]
    }));
  };

  const removeProduct = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      produtos: prev.produtos.filter(p => p.id !== id)
    }));
  };

  const selectRecipientFromDB = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if(!id) return;
    const selected = savedRecipients.find(i => i.id === id);
    if(selected) setInvoice(prev => ({ ...prev, destinatario: selected }));
  };

  const saveDraft = async () => {
      const draftInvoice: InvoiceData = {
          ...invoice,
          status: 'draft',
          id: invoice.id || crypto.randomUUID()
      };
      await db.save('invoices', draftInvoice);
      setInvoice(draftInvoice); // Update local state with ID
      alert('Rascunho salvo com sucesso! Você pode continuar editando mais tarde no Histórico.');
  };

  const handleEditDraft = (draft: InvoiceData) => {
      setInvoice({ ...draft, status: 'editing' });
      setConfig(prev => ({ ...prev, proximoNumeroNota: draft.numero, serie: draft.serie }));
      setViewMode('invoice');
      setCurrentStep(Step.CONFIG);
      setStatus('editing');
  };

  const transmitNfe = async () => {
    if (!config.certificado) {
        alert("ERRO: Certificado Digital não encontrado. A assinatura é obrigatória.");
        return;
    }
    setStatus('signing');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStatus('transmitting');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStatus('authorized');
    
    const finalizedInvoice: InvoiceData = {
        ...invoice,
        status: 'authorized',
        id: invoice.id || crypto.randomUUID(), 
        xmlAssinado: xmlPreview 
    };
    await db.save('invoices', finalizedInvoice);
    
    setConfig(prev => ({
        ...prev,
        proximoNumeroNota: (parseInt(prev.proximoNumeroNota) + 1).toString()
    }));
  };

  const processEvent = async (invoice: InvoiceData, type: 'cancelamento' | 'cce', payload: string) => {
      if (invoice.status === 'draft' && type === 'cancelamento') {
          if(confirm("Deseja realmente excluir este rascunho permanentemente?")) {
              if (invoice.id) await db.delete('invoices', invoice.id);
              setViewMode('history'); // Refresh
          }
          return;
      }

      if (!config.certificado) {
          alert("ERRO: Certificado Digital não encontrado.");
          return;
      }
      setEventProcessing(type === 'cancelamento' ? 'Cancelando...' : 'Corrigindo...');
      try {
          await new Promise(resolve => setTimeout(resolve, 1500)); 
          await new Promise(resolve => setTimeout(resolve, 2000));
          const currentInvoices = await db.get<InvoiceData>('invoices');
          const idx = currentInvoices.findIndex(i => i.id === invoice.id);
          
          if (idx >= 0) {
              const updatedInvoice = { ...currentInvoices[idx] };
              if (type === 'cancelamento') updatedInvoice.status = 'cancelled';
              updatedInvoice.historicoEventos = [
                  ...(updatedInvoice.historicoEventos || []),
                  {
                      tipo: type,
                      data: new Date().toISOString(),
                      detalhe: payload,
                      protocolo: `135${Math.floor(Math.random() * 9999999999)}`
                  }
              ];
              await db.save('invoices', updatedInvoice);
              setViewMode('history');
              alert(type === 'cancelamento' ? "Nota Fiscal Cancelada!" : "Carta de Correção Vinculada!");
          }
      } catch (error) {
          alert("Erro na transmissão do evento.");
      } finally {
          setEventProcessing(null);
      }
  };

  const handleDuplicate = (source: InvoiceData) => {
      setInvoice({
          ...source,
          id: undefined, 
          numero: config.proximoNumeroNota,
          serie: config.serie,
          emitente: activeProfile!, 
          chaveAcesso: undefined,
          xmlAssinado: undefined,
          status: 'editing',
          finalidade: '1',
          refNFe: undefined,
          dataEmissao: new Date().toISOString().split('T')[0]
      });
      setViewMode('invoice');
      setCurrentStep(Step.CONFIG);
      setStatus('editing');
  };

  const handleComplementary = (source: InvoiceData) => {
      setInvoice({
          ...source,
          id: undefined,
          numero: config.proximoNumeroNota,
          serie: config.serie,
          emitente: activeProfile!,
          chaveAcesso: undefined,
          xmlAssinado: undefined,
          status: 'editing',
          finalidade: '2',
          refNFe: source.chaveAcesso,
          dataEmissao: new Date().toISOString().split('T')[0],
          produtos: [] 
      });
      setViewMode('invoice');
      setCurrentStep(Step.CONFIG);
      setStatus('editing');
      alert(`Iniciando nota complementar referente à chave: ${source.chaveAcesso}.`);
  };

  const handlePrint = (inv: InvoiceData) => {
      setPrintInvoice(inv);
      setTimeout(() => window.print(), 100);
  };

  const handleRequestCancel = (inv: InvoiceData) => {
      const reason = prompt("Justificativa de cancelamento (min 15 chars):");
      if (reason && reason.length >= 15) processEvent(inv, 'cancelamento', reason);
  };

  const handleRequestCorrection = (inv: InvoiceData) => {
      const correction = prompt("Correção (min 15 chars):");
      if (correction && correction.length >= 15) processEvent(inv, 'cce', correction);
  };

  const downloadXml = () => {
    const blob = new Blob([xmlPreview], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.chaveAcesso}-nfe.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderRegistry = () => {
    const EntityWrapper = ({ initial, onSave, onCancel }: { initial: Entity | null, onSave: (i: Entity) => Promise<void> | void, onCancel: () => void }) => {
        const [data, setData] = useState<Entity>(initial || { ...initialEntity, id: crypto.randomUUID() });
        return (
            <div>
                <EntityForm title="Dados do Cadastro" data={data} onChange={setData} />
                <div className="flex justify-end gap-2 mt-4 px-6">
                    <button onClick={onCancel} className="px-4 py-2 border rounded">Cancelar</button>
                    <button onClick={() => onSave(data)} className="px-4 py-2 bg-primary-600 text-white rounded">Salvar</button>
                </div>
            </div>
        )
    };

    const ProductWrapper = ({ initial, onSave, onCancel }: { initial: Product | null, onSave: (i: Product) => void, onCancel: () => void }) => {
        const [tempList, setTempList] = useState<Product[]>([]);
        return (
            <div>
               <div className="p-4 bg-yellow-50 text-yellow-800 rounded mb-4 text-sm">
                   Configure as tributações padrão para o regime da empresa ativa.
               </div>
               <ProductForm 
                    products={tempList} 
                    issuerCrt={activeProfile?.crt || '1'}
                    issuerUf={activeProfile?.endereco.uf}
                    onAdd={(p) => { onSave({...p, id: initial?.id || p.id}); }} 
                    onRemove={()=>{}} 
                />
               <div className="flex justify-end gap-2 mt-4 px-6">
                    <button onClick={onCancel} className="px-4 py-2 border rounded">Cancelar</button>
               </div>
            </div>
        )
    };

    if (viewMode === 'issuers') {
        return <RegistryManager 
            collection="issuers" 
            title="Gerenciar Emissores (Empresas)" 
            renderListItem={(item: Entity) => (
                <div className="flex items-center">
                    <div className="mr-3 p-2 bg-blue-100 rounded-full"><Building2 className="w-5 h-5 text-blue-600"/></div>
                    <div>
                        <p className="font-bold text-gray-800">{item.razaoSocial}</p>
                        <p className="text-sm text-gray-500">CNPJ: {item.cnpj} | CRT: {item.crt === '1' ? 'Simples' : 'Normal'}</p>
                    </div>
                </div>
            )}
            renderForm={async (item, onSave, onCancel) => <EntityWrapper initial={item} onSave={async (e) => { await onSave(e); setShowProfileSelector(true); }} onCancel={onCancel} />}
        />
    }
    if (viewMode === 'recipients') {
        return <RegistryManager 
            collection="recipients" 
            title="Gerenciar Destinatários" 
            renderListItem={(item: Entity) => (
                <div>
                    <p className="font-bold text-gray-800">{item.razaoSocial}</p>
                    <p className="text-sm text-gray-500">{item.cnpj}</p>
                </div>
            )}
            renderForm={(item, onSave, onCancel) => <EntityWrapper initial={item} onSave={onSave} onCancel={onCancel} />}
        />
    }
    if (viewMode === 'products') {
        return <RegistryManager 
            collection="products" 
            title="Gerenciar Produtos" 
            renderListItem={(item: Product) => (
                <div>
                    <p className="font-bold text-gray-800">{item.descricao}</p>
                    <p className="text-sm text-gray-500">NCM: {item.ncm} | R$ {item.valorUnitario.toFixed(2)}</p>
                </div>
            )}
            renderForm={(item, onSave, onCancel) => <ProductWrapper initial={item} onSave={onSave} onCancel={onCancel} />}
        />
    }
    return null;
  };

  const renderInvoiceStep = () => {
    switch (currentStep) {
      case Step.CONFIG:
        return <ConfigForm data={config} onChange={setConfig} />;
      case Step.EMITENTE:
        return (
          <div className="space-y-6">
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                        <span className="text-blue-800 font-bold block">{activeProfile?.razaoSocial}</span>
                        <span className="text-blue-600 text-sm">CNPJ: {activeProfile?.cnpj} | Regime: {activeProfile?.crt === '1' ? 'Simples Nacional' : 'Regime Normal'}</span>
                    </div>
                </div>
                <div className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">Emitente Automático</div>
             </div>
             <div className="opacity-70 pointer-events-none">
                <EntityForm title="Dados do Emitente" data={invoice.emitente} onChange={() => {}} />
             </div>
          </div>
        );
      case Step.DESTINATARIO:
        return (
          <div className="space-y-6">
             {savedRecipients.length > 0 && (
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center">
                    <Box className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 font-medium mr-3">Selecionar:</span>
                    <select 
                        className="flex-1 px-3 py-2 border rounded-md"
                        onChange={selectRecipientFromDB}
                        defaultValue=""
                    >
                        <option value="" disabled>Selecione...</option>
                        {savedRecipients.map(i => <option key={i.id} value={i.id}>{i.razaoSocial}</option>)}
                    </select>
                 </div>
             )}
             <EntityForm title="Dados do Destinatário" data={invoice.destinatario} onChange={(destinatario) => setInvoice(prev => ({ ...prev, destinatario }))} />
          </div>
        );
      case Step.PRODUTOS:
        return (
          <>
            <div className="mb-4 flex justify-end">
                <button onClick={() => setShowProductSelector(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    <Search className="w-4 h-4 mr-2" /> Buscar do Banco / Intranet
                </button>
            </div>
            {showProductSelector && (
                <ProductSelector 
                    onClose={() => setShowProductSelector(false)}
                    externalProducts={externalProducts} // Passed from Intranet
                    onSelect={(prod) => {
                        // Recalculate tax with current profile CRT rules
                        addProduct({ ...prod, id: crypto.randomUUID(), valorTotal: prod.quantidade * prod.valorUnitario });
                        setShowProductSelector(false);
                    }}
                />
            )}
            <ProductForm 
                products={invoice.produtos} 
                issuerCrt={activeProfile?.crt || '1'} 
                issuerUf={activeProfile?.endereco.uf}
                recipientUf={invoice.destinatario.endereco.uf}
                onAdd={addProduct} 
                onRemove={removeProduct} 
            />
          </>
        );
      case Step.PAGAMENTO:
          return <PaymentAndObsForm data={invoice} onChange={setInvoice} />;
      case Step.EMISSAO:
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
                <span className="flex items-center"><Send className="w-5 h-5 mr-2 text-primary-600" /> Transmissão</span>
                {status === 'authorized' && <span className="text-green-600 flex items-center text-sm"><CheckCircle className="w-4 h-4 mr-1"/> Autorizada</span>}
            </h2>
            
            {status === 'editing' && (
                <div className="bg-slate-800 text-slate-200 p-4 rounded-md font-mono text-sm overflow-auto h-[350px] xml-preview">
                    <pre>{xmlPreview}</pre>
                </div>
            )}

            {status === 'signing' && (
                <div className="h-[350px] flex flex-col items-center justify-center bg-gray-50 rounded-md border border-gray-100">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                    <p className="text-gray-700 font-medium">Assinando XML...</p>
                </div>
            )}

             {status === 'transmitting' && (
                <div className="h-[350px] flex flex-col items-center justify-center bg-gray-50 rounded-md border border-gray-100">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-700 font-medium">Transmitindo para SEFAZ...</p>
                </div>
            )}

            {status === 'authorized' && (
                 <div className="h-[350px] flex flex-col items-center justify-center bg-green-50 rounded-md border border-green-100">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">Nota Autorizada!</h3>
                    <div className="flex gap-4">
                        <button onClick={downloadXml} className="flex items-center px-4 py-2 bg-white border border-green-300 text-green-700 rounded-md">
                            <Download className="w-4 h-4 mr-2" /> Baixar XML
                        </button>
                        <button onClick={() => handlePrint(invoice)} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md">
                            <Printer className="w-4 h-4 mr-2" /> Imprimir DANFE
                        </button>
                    </div>
                </div>
            )}

            {status === 'editing' && (
                <div className="mt-6 flex justify-end">
                <button onClick={transmitNfe} className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 shadow-md">
                    <Shield className="w-4 h-4 mr-2" /> Assinar e Transmitir
                </button>
                </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const NavButton = ({ mode, icon: Icon, label }: { mode: ViewMode, icon: any, label: string }) => (
    <button 
        onClick={() => {
            setViewMode(mode);
            if(mode === 'invoice') { setStatus('editing'); setCurrentStep(Step.CONFIG); }
        }}
        className={`flex items-center w-full px-4 py-3 rounded-lg mb-2 transition-colors ${viewMode === mode ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
    >
        <Icon className="w-5 h-5 mr-3" /> {label}
    </button>
  );

  return (
    <div className="min-h-full bg-gray-50 flex flex-col font-sans">
      <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
          {printInvoice && <Danfe invoice={printInvoice} />}
      </div>

      {showProfileSelector && (
          <ProfileSelector 
            profiles={profilesList}
            activeProfileId={activeProfile?.id || null}
            onSelect={handleProfileSelect}
            onCreateNew={handleCreateProfile}
          />
      )}

      {eventProcessing && (
          <div className="fixed inset-0 z-[9999] bg-black bg-opacity-70 flex items-center justify-center">
              <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{eventProcessing}</h3>
              </div>
          </div>
      )}

      {/* Internal NFe Header */}
      <div className="bg-white border-b border-gray-200 print:hidden p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Módulo NFe</h1>
          </div>
          
          <div className="flex items-center space-x-4">
             {activeProfile ? (
                 <div className="flex items-center px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                    <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900 mr-3">{activeProfile.razaoSocial}</span>
                    <button onClick={handleLogoutProfile} title="Trocar Empresa" className="text-blue-400 hover:text-blue-700">
                        <LogOut className="w-4 h-4" />
                    </button>
                 </div>
             ) : (
                 <span className="text-sm text-red-500 font-medium">Nenhuma Empresa Selecionada</span>
             )}
          </div>
      </div>

      <div className="flex flex-1 w-full mx-auto print:hidden mt-4">
        {/* Internal Sidebar for NFe Actions */}
        <aside className="w-64 px-4 hidden md:block">
            <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-4">Menu NFe</p>
                <NavButton mode="dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavButton mode="invoice" icon={Send} label="Emitir Nota" />
                <NavButton mode="history" icon={History} label="Histórico" />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-4">Cadastros</p>
                <NavButton mode="issuers" icon={Shield} label="Emissores" />
                <NavButton mode="recipients" icon={Users} label="Destinatários" />
                <NavButton mode="products" icon={Box} label="Produtos" />
            </div>
        </aside>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 overflow-x-hidden">
            {!activeProfile && viewMode !== 'issuers' ? (
                <div className="h-full flex flex-col items-center justify-center text-center mt-20">
                    <Building2 className="w-16 h-16 text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Selecione uma Empresa</h2>
                    <button onClick={() => setShowProfileSelector(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Selecionar Perfil</button>
                </div>
            ) : (
                <>
                    {viewMode === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div onClick={() => setViewMode('invoice')} className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-lg cursor-pointer transform hover:scale-105 transition-transform">
                                <Send className="w-8 h-8 mb-4 opacity-80" />
                                <h3 className="text-xl font-bold mb-2">Emitir Nova Nota</h3>
                            </div>
                            <div onClick={() => setViewMode('history')} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm cursor-pointer hover:border-primary-300 transition-colors">
                                <h3 className="text-lg font-bold text-gray-800">Histórico</h3>
                                <div className="mt-4 text-2xl font-bold text-gray-900">
                                    {invoiceCount} Notas
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'issuers' && renderRegistry()}
                    {viewMode === 'recipients' && renderRegistry()}
                    {viewMode === 'products' && renderRegistry()}
                    {viewMode === 'history' && (
                        <InvoiceHistory 
                            activeProfile={activeProfile}
                            onDuplicate={handleDuplicate} 
                            onComplementary={handleComplementary} 
                            onPrint={handlePrint}
                            onRequestCancel={handleRequestCancel}
                            onRequestCorrection={handleRequestCorrection}
                            onEditDraft={handleEditDraft}
                        />
                    )}

                    {viewMode === 'invoice' && (
                        <div>
                            <div className="mb-8 overflow-x-auto pb-2">
                                <div className="flex items-center justify-between w-full min-w-[600px] relative">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded"></div>
                                    {[
                                        { s: Step.CONFIG, label: 'Config', icon: Settings },
                                        { s: Step.EMITENTE, label: 'Emitente', icon: FileText },
                                        { s: Step.DESTINATARIO, label: 'Destinatário', icon: Users },
                                        { s: Step.PRODUTOS, label: 'Produtos', icon: ShoppingCart },
                                        { s: Step.PAGAMENTO, label: 'Pagamento', icon: CreditCard },
                                        { s: Step.EMISSAO, label: 'Emissão', icon: Send },
                                    ].map((step) => (
                                        <div key={step.s} className={`flex flex-col items-center bg-gray-50 px-2 ${currentStep >= step.s ? 'text-primary-600' : 'text-gray-400'}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-colors ${currentStep >= step.s ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300'}`}>
                                                <step.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-medium">{step.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
                                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                    <span className="text-red-700 font-medium">{errorMsg}</span>
                                </div>
                            )}

                            <div className="mb-20">
                                {renderInvoiceStep()}
                            </div>

                            <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-20">
                                <div className="max-w-5xl mx-auto flex items-center justify-between">
                                    <div className="text-sm">
                                        <span className="text-gray-500">Total:</span>
                                        <span className="ml-2 text-xl font-bold text-gray-900">R$ {invoice.totais.vNF.toFixed(2)}</span>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button onClick={saveDraft} className="flex items-center px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100" title="Salvar como Rascunho para continuar depois">
                                            <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
                                        </button>
                                        <div className="w-px h-8 bg-gray-300 mx-2"></div>
                                        <button onClick={handleBack} disabled={currentStep === Step.CONFIG} className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                                        </button>
                                        {currentStep < Step.EMISSAO ? (
                                            <button onClick={handleNext} className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                                                Próximo <ArrowRight className="w-4 h-4 ml-2" />
                                            </button>
                                        ) : (
                                            <button className="flex items-center px-6 py-2 bg-gray-100 text-gray-400 rounded-md cursor-default" disabled>
                                                Revisar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
      </div>
    </div>
  );
};

export default NFeModule;
