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
import { api } from '../utils/api';
import {
  FileText, Users, ShoppingCart, Send, ArrowRight, ArrowLeft, Download, CheckCircle, Shield, Settings,
  Loader2, AlertCircle, LayoutDashboard, Box, Search, History, Printer, Building2, LogOut, CreditCard, Save, Calendar
} from 'lucide-react';
import { Municipio } from '../types';

const initialEntity: Entity = {
  cnpj: '',
  razaoSocial: '',
  inscricaoEstadual: '',
  endereco: {
    logradouro: '', numero: '', bairro: '', municipio: '', codigoIbge: '', uf: '', cep: ''
  },
  crt: '1'
};

// TIPAGEM
type ViewMode = 'painel' | 'emissores' | 'destinatarios' | 'produtos' | 'nota' | 'historico';

interface NFeModuleProps {
  externalData: Municipio[];
}

const NFeModule: React.FC<NFeModuleProps> = ({ externalData }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('painel');
  const [currentStep, setCurrentStep] = useState<Step>(Step.CONFIG);

  // --- Helpers de Config ---
  const safeLocalStorageGet = (key: string) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const safeLocalStorageSet = (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  };

  // ✅ Função para pegar a hora local para o input datetime-local
  const getLocalNowForInput = (isoDate?: string) => {
    const d = isoDate ? new Date(isoDate) : new Date();
    // Ajusta o fuso horário manualmente para formato YYYY-MM-DDTHH:mm local
    const local = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return local.toISOString().slice(0, 16);
  };

  const [activeProfile, setActiveProfile] = useState<Entity | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [profilesList, setProfilesList] = useState<Entity[]>([]);
  const [invoiceCount, setInvoiceCount] = useState<number>(0);

  // Flatten external data into Products (Intranet)
  const [externalProducts, setExternalProducts] = useState<Product[]>([]);

  // ✅ Produtos internos (Cadastros > Produtos)
  const [internalProducts, setInternalProducts] = useState<Product[]>([]);
  const [internalProductsLoaded, setInternalProductsLoaded] = useState(false);

  // ✅ Função central para recarregar emissores e manter activeProfile atualizado
  const reloadProfiles = async (preferId?: string | null) => {
    try {
      const profiles = await api.get('/api/issuers');
      const safeProfiles = Array.isArray(profiles) ? profiles : [];
      setProfilesList(safeProfiles);

      const savedProfileId = preferId ?? localStorage.getItem('nfe_active_profile_id');
      if (savedProfileId) {
        const found = safeProfiles.find((p: Entity) => p.id === savedProfileId);
        if (found) {
          setActiveProfile(found);
          setShowProfileSelector(false);
          return;
        }
      }
      // Se não encontrou, força seletor
      setShowProfileSelector(true);
    } catch (error) {
      console.error("Erro ao carregar perfis", error);
      setShowProfileSelector(true);
    }
  };

  // 1. CARREGAR PERFIS (EMISSORES) VIA API
  useEffect(() => {
    reloadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. CARREGAR ESTATÍSTICAS (CONTAGEM DE NOTAS) VIA API
  useEffect(() => {
    const loadStats = async () => {
      if (activeProfile) {
        try {
          const allInvoices = await api.get('/api/nfe/notas');
          if (Array.isArray(allInvoices)) {
            const count = allInvoices.filter((i: InvoiceData) =>
              i.emitente?.cnpj?.replace(/\D/g, '') === activeProfile.cnpj.replace(/\D/g, '')
            ).length;
            setInvoiceCount(count);
          }
        } catch (error) {
          console.error("Erro ao carregar notas", error);
        }
      }
    };
    loadStats();
  }, [activeProfile, viewMode]);

  // Processamento de dados externos da Intranet
  useEffect(() => {
    if (externalData) {
      const flatProducts: Product[] = [];
      externalData.forEach(mun => {
        mun.editais.forEach(ed => {
          ed.itens.forEach(item => {
            flatProducts.push({
              id: item.id,
              codigo: item.id.substring(0, 8),
              descricao: `${item.descricao} (${item.marca || 'GEN'})`,
              gtin: 'SEM GTIN',
              ncm: '',
              cfop: '',
              unidade: item.unidade,
              quantidade: 1,
              valorUnitario: item.valorUnitario,
              valorTotal: item.valorUnitario,
              tax: {
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

  // ✅ Carregar produtos internos (Cadastros > Produtos) quando o seletor abrir
  const loadInternalProducts = async () => {
    try {
      const res = await api.get('/api/products');
      const arr = Array.isArray(res) ? res : [];
      // Garante que valores numéricos não venham quebrados
      const normalized: Product[] = arr.map((p: any) => ({
        ...p,
        valorUnitario: Number(p.valorUnitario || 0),
        valorTotal: Number(p.valorTotal || (Number(p.quantidade || 1) * Number(p.valorUnitario || 0))),
        quantidade: Number(p.quantidade || 1),
        unidade: p.unidade || 'UN',
        gtin: p.gtin || 'SEM GTIN',
      }));
      setInternalProducts(normalized);
      setInternalProductsLoaded(true);
    } catch (e) {
      console.error('Erro ao carregar produtos internos:', e);
    }
  };

  // ⚠️ Mantido por compatibilidade com ConfigForm existente.
  // ✅ Certificado/senha NÃO devem ser usados aqui. A fonte correta agora é o Emitente (activeProfile).
  // ✅ Padrão: PRODUÇÃO (ambiente = '1')
  const [config, setConfig] = useState<ConfigData>(() => {
    const serieLS = safeLocalStorageGet('nfe_serie');
    const proxLS = safeLocalStorageGet('nfe_proximo_numero');

    return {
      // ✅ padrão sempre em PRODUÇÃO
      ambiente: '1',
      proximoNumeroNota: proxLS || '1001',
      serie: serieLS || '1',
      certificado: null,        // legado (não usado)
      senhaCertificado: ''      // legado (não usado)
    };
  });

  // Se o usuário editar manualmente o número, evitamos sobrescrever automaticamente.
  const [numeroFoiEditadoManual, setNumeroFoiEditadoManual] = useState(false);

  const handleConfigChange = (next: ConfigData) => {
    // Qualquer alteração vinda do formulário é considerada ação do usuário.
    if (next.proximoNumeroNota !== config.proximoNumeroNota) {
      setNumeroFoiEditadoManual(true);
    }
    setConfig(next);
  };

  // Persistir configurações básicas (ambiente/série/próximo número)
  useEffect(() => {
    safeLocalStorageSet('nfe_ambiente', config.ambiente);
    safeLocalStorageSet('nfe_serie', config.serie);
    safeLocalStorageSet('nfe_proximo_numero', config.proximoNumeroNota);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.ambiente, config.serie, config.proximoNumeroNota]);

  const [invoice, setInvoice] = useState<InvoiceData>({
    numero: '1001',
    serie: '1',
    // ✅ CORREÇÃO: Usar ISO completo para suportar Hora
    dataEmissao: new Date().toISOString(),
    emitente: { ...initialEntity },
    destinatario: { ...initialEntity },
    totais: { vBC: 0, vICMS: 0, vProd: 0, vFrete: 0, vSeg: 0, vDesc: 0, vIPI: 0, vPIS: 0, vCOFINS: 0, vOutro: 0, vNF: 0 },
    produtos: [],
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

  // 3. CARREGAR DESTINATÁRIOS VIA API
  useEffect(() => {
    if (currentStep === Step.DESTINATARIO) {
      const fetchRecipients = async () => {
        try {
          const res = await api.get('/api/recipients');
          setSavedRecipients(Array.isArray(res) ? res : []);
        } catch (err) {
          console.error(err);
        }
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

  // ✅ Auto: calcular próximo número de NF-e com base no histórico do emitente
  const calcularProximoNumeroPorHistorico = async (opts?: { force?: boolean }) => {
    const force = !!opts?.force;
    if (!activeProfile) return;

    // Se estiver editando um rascunho existente, não sobrescrever.
    if (invoice?.id) return;

    // Se o usuário já editou manualmente, só recalcula quando forçado.
    if (numeroFoiEditadoManual && !force) return;

    try {
      const data = await api.get('/api/nfe/notas');
      const cleanCnpj = (s: string) => (s || '').replace(/\D/g, '');
      const activeCnpj = cleanCnpj(activeProfile.cnpj);
      const serieAtual = (config.serie || '1').toString();

      const profileInvoices: InvoiceData[] = Array.isArray(data)
        ? data.filter((inv: InvoiceData) => cleanCnpj(inv.emitente?.cnpj) === activeCnpj)
        : [];

      const numeros = profileInvoices
        .filter(inv => (inv.serie || '').toString() === serieAtual)
        .map(inv => parseInt(String(inv.numero || '').replace(/\D/g, ''), 10))
        .filter(n => Number.isFinite(n));

      const maxNumero = numeros.length ? Math.max(...numeros) : NaN;
      if (Number.isFinite(maxNumero)) {
        const proximo = String(maxNumero + 1);
        setConfig(prev => ({ ...prev, proximoNumeroNota: proximo }));
      }
    } catch (e) {
      console.error('Erro ao calcular próximo número pelo histórico:', e);
    }
  };

  // Recalcula automaticamente quando troca de emitente ou de série
  useEffect(() => {
    if (!activeProfile) return;
    // Ao trocar de emitente, libera o auto novamente.
    setNumeroFoiEditadoManual(false);
    calcularProximoNumeroPorHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.id, config.serie]);

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
    const newTotals = calculateInvoiceTotals(invoice.produtos, invoice.globalValues);
    setInvoice(prev => ({
      ...prev,
      totais: newTotals,
    }));
  }, [invoice.produtos, invoice.globalValues]);

  useEffect(() => {
    if (currentStep === Step.EMISSAO && viewMode === 'nota' && status === 'editing') {
      const accessKey = generateAccessKey(invoice, config.ambiente);
      const xml = generateNfeXml({ ...invoice, chaveAcesso: accessKey }, config.ambiente);
      setInvoice(prev => ({ ...prev, chaveAcesso: accessKey, xmlAssinado: xml }));
      setXmlPreview(xml);
    }
  }, [
    currentStep,
    invoice.produtos,
    invoice.destinatario,
    invoice.emitente,
    invoice.pagamento,
    invoice.informacoesComplementares,
    invoice.globalValues,
    config.ambiente,
    viewMode,
    status,
    invoice.dataEmissao // ✅ Agora reage à data também
  ]);

  // ✅ quando abrir o seletor, carrega produtos internos também
  useEffect(() => {
    if (showProductSelector && !internalProductsLoaded) {
      loadInternalProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProductSelector]);

  const handleProfileSelect = (profile: Entity) => {
    setActiveProfile(profile);
    setViewMode('painel');
  };

  const handleCreateProfile = () => {
    setViewMode('emissores');
    setShowProfileSelector(false);
  };

  const handleLogoutProfile = () => {
    setActiveProfile(null);
    localStorage.removeItem('nfe_active_profile_id');
    setShowProfileSelector(true);
  };

  // --- LÓGICA DE IMPORTAÇÃO DE XML ---
  const triggerImport = () => {
    document.getElementById('hiddenXmlInput')?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const xmlContent = e.target?.result as string;
      if (!xmlContent) return;

      try {
        setEventProcessing('Importando XML...');
        // Chama a rota que criamos no server.js
        const res = await api.post('/api/nfe/importar', { xmlContent });
        
        alert('✅ XML Importado com sucesso!');
        
        // Se estivermos no histórico, força recarregar
        if (viewMode === 'historico') {
           setViewMode('painel');
           setTimeout(() => setViewMode('historico'), 50);
        } else {
            setViewMode('historico');
        }

      } catch (error: any) {
        alert('Erro ao importar: ' + (error.response?.data?.erro || error.message));
      } finally {
        setEventProcessing(null);
        event.target.value = ''; // Limpa para permitir selecionar o mesmo arquivo
      }
    };
    reader.readAsText(file);
  };

  const validateStep = (): boolean => {
    setErrorMsg(null);

    if (currentStep === Step.CONFIG) {
      if (!config.proximoNumeroNota || !config.serie) {
        setErrorMsg("Defina o número e a série da nota.");
        return false;
      }
      // ✅ Valida se tem data
      if (!invoice.dataEmissao) {
        setErrorMsg("Data de emissão é obrigatória.");
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

      // ✅ PRODUÇÃO: evitar rejeição 232 (IE não informada)
      if (config.ambiente === '1') {
        const ieRaw = (invoice.destinatario.inscricaoEstadual || '').trim().toUpperCase();
        const ieDigits = ieRaw.replace(/\D/g, '');
        const ieOk = (ieRaw === 'ISENTO') || (ieDigits.length > 0);

        if (!ieOk) {
          setErrorMsg("Em PRODUÇÃO, informe a Inscrição Estadual (IE) do destinatário ou 'ISENTO'.");
          return false;
        }
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

  const handleUpdateProduct = (updatedProduct: Product) => {
    setInvoice(prev => {
      const newProducts = prev.produtos.map(p =>
        p.id === updatedProduct.id ? updatedProduct : p
      );
      const newTotals = calculateInvoiceTotals(newProducts, prev.globalValues);
      return {
        ...prev,
        produtos: newProducts,
        totais: newTotals
      };
    });
  };

  const selectRecipientFromDB = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const selected = savedRecipients.find(i => i.id === id);
    if (selected) setInvoice(prev => ({ ...prev, destinatario: selected }));
  };

  // 4. SALVAR RASCUNHO (POST/PUT API)
  const saveDraft = async () => {
    const draftInvoice: InvoiceData = {
      ...invoice,
      status: 'draft',
      id: invoice.id || crypto.randomUUID()
    };

    try {
      const saved = await api.post('/api/nfe/notas', draftInvoice);
      setInvoice(saved);
      alert('Rascunho salvo no banco de dados com sucesso!');
    } catch (e) {
      alert('Erro ao salvar rascunho.');
      console.error(e);
    }
  };

  const handleEditDraft = (draft: InvoiceData) => {
    setInvoice({ ...draft, status: 'editing' });
    setConfig(prev => ({ ...prev, proximoNumeroNota: draft.numero, serie: draft.serie }));
    setViewMode('nota');
    setCurrentStep(Step.CONFIG);
    setStatus('editing');
  };

  // ✅ 5. TRANSMISSÃO (CERTIFICADO VEM DO EMITENTE, NÃO DA CONFIG)
  const transmitNfe = async () => {
    if (!activeProfile) {
      alert("ERRO: Nenhum emitente selecionado.");
      return;
    }

    const issuerHasCert = !!activeProfile.certificadoArquivo; // "Presente" conta
    const issuerHasSenha = !!activeProfile.certificadoSenha;  // normalmente vem "***" quando existe

    if (!issuerHasCert || !issuerHasSenha) {
      alert("ERRO: Certificado e/ou senha não cadastrados no Emitente. Vá em Cadastros > Emissores e cadastre o A1 e a senha.");
      return;
    }

    // ✅ PRODUÇÃO: reforço contra rejeição 232
    if (config.ambiente === '1') {
      const ieRaw = (invoice.destinatario.inscricaoEstadual || '').trim().toUpperCase();
      const ieDigits = ieRaw.replace(/\D/g, '');
      const ieOk = (ieRaw === 'ISENTO') || (ieDigits.length > 0);
      if (!ieOk) {
        alert("Em PRODUÇÃO, informe a IE do destinatário ou 'ISENTO' (Cadastros > Destinatários).");
        return;
      }
    }

    if (!invoice.id) {
      alert("ERRO: O ID da nota é obrigatório para transmissão. Salve como rascunho antes.");
      return;
    }

    setStatus('transmitting');

    try {
      // Backend busca cert+senha do emitente via CNPJ e assina antes de transmitir
      const response = await api.post('/api/nfe/transmitir', { id: invoice.id });

      const newStatus = response.status as InvoiceStatus;

      setInvoice(prev => ({
        ...prev,
        status: newStatus,
        xmlAssinado: response.xml || prev.xmlAssinado,
        // ✅ chave oficial vem do backend
        chaveAcesso: response.chNFe || prev.chaveAcesso,
        protocoloAutorizacao: response.protocolo || (prev as any).protocoloAutorizacao,
        historicoEventos: [
          ...(prev.historicoEventos || []),
          {
            tipo: 'autorizacao' as any,
            data: new Date().toISOString(),
            detalhe: `Autorizada. Protocolo: ${response.protocolo}`,
            protocolo: response.protocolo
          } as any
        ]
      }));

      if (newStatus === 'authorized') {
        alert(`✅ Nota Fiscal Autorizada com Sucesso! Protocolo: ${response.protocolo}`);
        setConfig(prev => ({
          ...prev,
          proximoNumeroNota: (parseInt(prev.proximoNumeroNota) + 1).toString()
        }));
      } else if (newStatus === 'processing') {
        alert(`⚠️ Lote da NFe em processamento na SEFAZ. Consulte o status mais tarde.`);
      }

      setStatus(newStatus);
    } catch (error: any) {
      setStatus('rejected');
      const errorMessage = error?.message || "Erro desconhecido ao tentar transmitir.";
      alert(`❌ Transmissão Falhou:\n\n${errorMessage}`);
    }
  };

  // ✅ 6. PROCESSAR EVENTO (CANCELAMENTO REAL VIA API)
  const processEvent = async (inv: InvoiceData, type: 'cancelamento' | 'cce', payload: string) => {
    // Validação de Rascunho
    if (inv.status === 'draft' && type === 'cancelamento') {
      if (confirm("Deseja realmente excluir este rascunho permanentemente?")) {
        if (inv.id) {
          await api.delete(`/api/nfe/notas/${inv.id}`);
        }
        setViewMode('historico');
      }
      return;
    }

    if (!activeProfile) {
      alert("ERRO: Nenhum emitente selecionado.");
      return;
    }

    setEventProcessing(type === 'cancelamento' ? 'Cancelando na SEFAZ...' : 'Corrigindo...');
    
    try {
      if (type === 'cancelamento') {
        // Chamada ao Backend Real
        const response = await api.post('/api/nfe/cancelar', {
          id: inv.id,
          justificativa: payload
        });

        if (response.sucesso || response.data?.sucesso) {
            alert('✅ Nota Cancelada com Sucesso!');
             // Força atualização da lista ou recarrega a view
             setViewMode('painel'); 
             setTimeout(() => setViewMode('historico'), 100); 
        }
      } else {
        // Implementação futura para Carta de Correção (CCe)
        alert('Funcionalidade de CCe (Carta de Correção) ainda pendente no Backend.');
      }

    } catch (error: any) {
      const msg = error.response?.data?.erro || error.message || "Erro desconhecido";
      alert(`❌ Erro ao processar evento: ${msg}`);
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
      // ✅ CORREÇÃO: Data completa
      dataEmissao: new Date().toISOString()
    });
    setViewMode('nota');
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
      // ✅ CORREÇÃO: Data completa
      dataEmissao: new Date().toISOString(),
      produtos: []
    });
    setViewMode('nota');
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
    const EntityWrapper = ({
      initial,
      onSave,
      onCancel
    }: {
      initial: Entity | null,
      onSave: (i: Entity) => Promise<void> | void,
      onCancel: () => void
    }) => {
      const [data, setData] = useState<Entity>(initial || { ...initialEntity, id: '' });

      return (
        <div>
          <EntityForm title="Dados do Cadastro" data={data} onChange={setData} />
          <div className="flex justify-end gap-2 mt-4 px-6">
            <button onClick={onCancel} className="px-4 py-2 border rounded">Cancelar</button>
            <button onClick={() => onSave(data)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
          </div>
        </div>
      );
    };

    const ProductWrapper = ({
      initial,
      onSave,
      onCancel
    }: {
      initial: Product | null,
      onSave: (i: Product) => void,
      onCancel: () => void
    }) => {
      const [tempList] = useState<Product[]>([]);
      return (
        <div>
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded mb-4 text-sm">
            Configure as tributações padrão para o regime da empresa ativa.
          </div>
          <ProductForm
            products={tempList}
            issuerCrt={activeProfile?.crt || '1'}
            issuerUf={activeProfile?.endereco.uf}
            onAdd={(p) => { onSave({ ...p, id: initial?.id || p.id }); }}
            onRemove={() => { }}
            onUpdate={() => { }}
          />
          <div className="flex justify-end gap-2 mt-4 px-6">
            <button onClick={onCancel} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </div>
      );
    };

    if (viewMode === 'emissores') {
      return (
        <RegistryManager
          collection="issuers"
          title="Gerenciar Emissores (Empresas)"
          renderListItem={(item: Entity) => (
            <div className="flex items-center">
              <div className="mr-3 p-2 bg-blue-100 rounded-full"><Building2 className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="font-bold text-gray-800">{item.razaoSocial}</p>
                <p className="text-sm text-gray-500">CNPJ: {item.cnpj} | CRT: {item.crt === '1' ? 'Simples' : 'Normal'}</p>
              </div>
            </div>
          )}
          renderForm={(item, onSave, onCancel) => (
            <EntityWrapper
              initial={item}
              onSave={async (e) => {
                await onSave(e);
                await reloadProfiles(e.id || null);
                setShowProfileSelector(true);
              }}
              onCancel={onCancel}
            />
          )}
        />
      );
    }

    if (viewMode === 'destinatarios') {
      return (
        <RegistryManager
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
      );
    }

    if (viewMode === 'produtos') {
      return (
        <RegistryManager
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
      );
    }

    return null;
  };

  // ✅ mesclar produtos internos + intranet, evitando duplicados óbvios
  const mergedSelectableProducts = (() => {
    const map = new Map<string, Product>();
    const keyOf = (p: Product) => {
      const cod = (p.codigo || '').trim().toUpperCase();
      const desc = (p.descricao || '').trim().toUpperCase();
      return `${cod}::${desc}`;
    };
    // prioridade: internos primeiro
    internalProducts.forEach(p => map.set(keyOf(p), p));
    externalProducts.forEach(p => {
      const k = keyOf(p);
      if (!map.has(k)) map.set(k, p);
    });
    return Array.from(map.values());
  })();

  const renderInvoiceStep = () => {
    switch (currentStep) {
      case Step.CONFIG:
        {
          const certOk = !!activeProfile?.certificadoArquivo && !!activeProfile?.certificadoSenha;
          const ambienteLabel = config.ambiente === '1'
            ? 'Produção (com validade jurídica)'
            : 'Homologação (testes)';

          return (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${certOk ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {certOk ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-700 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-bold ${certOk ? 'text-green-800' : 'text-yellow-800'}`}>
                        {certOk ? 'Certificado já configurado' : 'Certificado não configurado'}
                      </p>
                      <p className={`text-sm ${certOk ? 'text-green-700' : 'text-yellow-700'}`}>
                        {activeProfile
                          ? `Emitente: ${activeProfile.razaoSocial} (CNPJ: ${activeProfile.cnpj})`
                          : 'Selecione um emitente para verificar o certificado.'}
                      </p>
                      <p className={`text-xs mt-1 ${certOk ? 'text-green-700' : 'text-yellow-700'}`}>
                        Observação: o A1 utilizado na transmissão é o do cadastro do Emitente.
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-600">Ambiente de emissão</p>
                    <p className="font-bold text-gray-800">{ambienteLabel}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-sm"
                    onClick={() => {
                      setNumeroFoiEditadoManual(false);
                      calcularProximoNumeroPorHistorico({ force: true });
                    }}
                  >
                    Recalcular próximo número
                  </button>

                  <button
                    type="button"
                    className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
                    onClick={() => setViewMode('emissores')}
                  >
                    Gerenciar Emitente / Certificado
                  </button>
                </div>
              </div>

              <ConfigForm data={config} onChange={handleConfigChange} />

              {/* ✅ CAMPO DE DATA E HORA DE EMISSÃO (NOVO) */}
              <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  Data e Hora de Emissão
                </label>
                <div className="flex gap-2 items-center">
                    <input
                        type="datetime-local"
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
                        value={getLocalNowForInput(invoice.dataEmissao)}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                                // Converte o valor do input (local) de volta para ISO completo (UTC/Offset)
                                setInvoice(prev => ({ ...prev, dataEmissao: new Date(val).toISOString() }));
                            }
                        }}
                    />
                    <button
                        onClick={() => setInvoice(prev => ({ ...prev, dataEmissao: new Date().toISOString() }))}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-300 text-sm"
                        title="Definir para Agora"
                    >
                        Agora
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Esta data será enviada no XML. Se estiver no passado, certifique-se de que é permitido pela SEFAZ (limite ~30 dias).
                </p>
              </div>

            </div>
          );
        }

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
              <EntityForm title="Dados do Emitente" data={invoice.emitente} onChange={() => { }} />
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

            {config.ambiente === '1' && (
              <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                Em <b>PRODUÇÃO</b>, informe a <b>IE</b> do destinatário (ou <b>ISENTO</b>) para evitar rejeição <b>232</b>.
              </div>
            )}
          </div>
        );

      case Step.PRODUTOS:
        return (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowProductSelector(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Search className="w-4 h-4 mr-2" /> Buscar (Cadastros / Banco / Intranet)
              </button>
            </div>

            {showProductSelector && (
              <ProductSelector
                onClose={() => setShowProductSelector(false)}
                externalProducts={mergedSelectableProducts}
                onSelect={(prod) => {
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
              onUpdate={handleUpdateProduct}
            />
          </>
        );

      case Step.PAGAMENTO:
        return <PaymentAndObsForm data={invoice} onChange={setInvoice} />;

      case Step.EMISSAO:
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
              <span className="flex items-center"><Send className="w-5 h-5 mr-2 text-blue-600" /> Transmissão</span>
              {status === 'authorized' && <span className="text-green-600 flex items-center text-sm"><CheckCircle className="w-4 h-4 mr-1" /> Autorizada</span>}
            </h2>

            {status === 'editing' && (
              <div className="bg-slate-800 text-slate-200 p-4 rounded-md font-mono text-sm overflow-auto h-[350px] xml-preview">
                <pre>{xmlPreview}</pre>
              </div>
            )}

            {status === 'signing' && (
              <div className="h-[350px] flex flex-col items-center justify-center bg-gray-50 rounded-md border border-gray-100">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
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
                <button onClick={transmitNfe} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-md">
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
        if (mode === 'nota') { setStatus('editing'); setCurrentStep(Step.CONFIG); }
      }}
      className={`flex items-center w-full px-4 py-3 rounded-lg mb-2 transition-colors ${viewMode === mode ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
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
            <NavButton mode="painel" icon={LayoutDashboard} label="Painel" />
            <NavButton mode="nota" icon={Send} label="Emitir Nota" />
            <NavButton mode="historico" icon={History} label="Histórico" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-4">Cadastros</p>
            <NavButton mode="emissores" icon={Shield} label="Emissores" />
            <NavButton mode="destinatarios" icon={Users} label="Destinatários" />
            <NavButton mode="produtos" icon={Box} label="Produtos" />
          </div>
        </aside>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 overflow-x-hidden">
          {!activeProfile && viewMode !== 'emissores' && viewMode !== 'painel' ? (
            <div className="h-full flex flex-col items-center justify-center text-center mt-20">
              <Building2 className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Selecione uma Empresa</h2>
              <button onClick={() => setShowProfileSelector(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Selecionar Perfil</button>
            </div>
          ) : (
            <>
              {viewMode === 'painel' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div onClick={() => setViewMode('nota')} className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg cursor-pointer transform hover:scale-105 transition-transform">
                    <Send className="w-8 h-8 mb-4 opacity-80" />
                    <h3 className="text-xl font-bold mb-2">Emitir Nova Nota</h3>
                  </div>
                  <div onClick={() => setViewMode('historico')} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                    <h3 className="text-lg font-bold text-gray-800">Histórico</h3>
                    <div className="mt-4 text-2xl font-bold text-gray-900">
                      {invoiceCount} Notas
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'emissores' && renderRegistry()}
              {viewMode === 'destinatarios' && renderRegistry()}
              {viewMode === 'produtos' && renderRegistry()}

              {viewMode === 'historico' && (
                <InvoiceHistory
                  activeProfile={activeProfile}
                  onDuplicate={handleDuplicate}
                  onComplementary={handleComplementary}
                  onPrint={handlePrint}
                  onRequestCancel={handleRequestCancel}
                  onRequestCorrection={handleRequestCorrection}
                  onEditDraft={handleEditDraft}
                  // 👇 AQUI ESTÁ A CONEXÃO COM O BOTÃO IMPORTAR
                  onImportClick={triggerImport} 
                />
              )}

              {viewMode === 'nota' && (
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
                        <div key={step.s} className={`flex flex-col items-center bg-gray-50 px-2 ${currentStep >= step.s ? 'text-blue-600' : 'text-gray-400'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-colors ${currentStep >= step.s ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
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
                          <button onClick={handleNext} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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

      {/* 👇 INPUT INVISÍVEL PARA IMPORTAÇÃO DE XML */}
      <input 
        type="file" 
        id="hiddenXmlInput" 
        accept=".xml" 
        className="hidden" 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
      />
    </div>
  );
};

export default NFeModule;
