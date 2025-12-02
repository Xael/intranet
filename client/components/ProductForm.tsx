import React, { useState, useEffect } from 'react';
import { Product, CRT, TaxDetails } from '../types';
import { Input } from './Input';
import { getNcmSuggestion } from '../services/geminiService';
import { calculateItemTax } from '../utils/taxCalculations';
import { Loader2, Sparkles, Trash2, Plus, Calculator, Barcode } from 'lucide-react';

interface ProductFormProps {
  products: Product[];
  issuerCrt: CRT;
  issuerUf?: string;
  recipientUf?: string;
  onAdd: (product: Product) => void;
  onRemove: (id: string) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ products, issuerCrt, issuerUf, recipientUf, onAdd, onRemove }) => {
  const [newProduct, setNewProduct] = useState<Partial<Product> & { tempTax: Partial<TaxDetails> }>({
    descricao: '',
    quantidade: 1,
    valorUnitario: 0,
    ncm: '',
    cfop: '',
    unidade: 'UN',
    codigo: '',
    gtin: 'SEM GTIN',
    tempTax: {
        origem: '0',
        cst: '00', 
        csosn: '102', 
        aliquotaIcms: 0,
        cstPis: '07', 
        aliquotaPis: 0,
        cstCofins: '07',
        aliquotaCofins: 0,
        cstIpi: '53', // Default Non-Taxed IPI
        aliquotaIpi: 0,
        codigoEnquadramento: '999'
    }
  });
  
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorAi, setErrorAi] = useState<string | null>(null);

  // Smart CFOP Logic
  useEffect(() => {
      // Runs when component mounts or UFs change. 
      // Only suggests if CFOP is empty to avoid overwriting user manual input or edit mode.
      if (!newProduct.cfop && issuerUf && recipientUf) {
          let prefix = '5';
          if (recipientUf === 'EX') {
              prefix = '7';
          } else if (issuerUf !== recipientUf) {
              prefix = '6';
          }
          setNewProduct(prev => ({...prev, cfop: `${prefix}102`})); // Suggesting simple sale
      }
  }, [issuerUf, recipientUf]);

  const calculatedValues = calculateItemTax(
      newProduct.quantidade || 0,
      newProduct.valorUnitario || 0,
      issuerCrt,
      newProduct.tempTax
  );

  const handleAiSuggestion = async () => {
    if (!newProduct.descricao || newProduct.descricao.length < 3) {
      setErrorAi("Digite uma descrição válida primeiro.");
      return;
    }
    setLoadingAi(true);
    setErrorAi(null);
    try {
      const suggestion = await getNcmSuggestion(newProduct.descricao);
      setNewProduct(prev => ({
        ...prev,
        ncm: suggestion.ncm,
        // We prefer our Smart CFOP logic over AI for the prefix, but AI can help with suffix
        cfop: prev.cfop || suggestion.cfop, 
      }));
    } catch (e) {
      setErrorAi("Falha ao obter sugestão. Tente novamente.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAdd = () => {
    if (newProduct.descricao && newProduct.valorUnitario && newProduct.quantidade) {
      const taxData: TaxDetails = {
          origem: newProduct.tempTax.origem || '0',
          cst: newProduct.tempTax.cst,
          csosn: newProduct.tempTax.csosn,
          baseCalculoIcms: calculatedValues.baseCalculoIcms,
          aliquotaIcms: newProduct.tempTax.aliquotaIcms || 0,
          valorIcms: calculatedValues.valorIcms,
          
          cstPis: newProduct.tempTax.cstPis || '07',
          baseCalculoPis: calculatedValues.baseCalculoPis,
          aliquotaPis: newProduct.tempTax.aliquotaPis || 0,
          valorPis: calculatedValues.valorPis,

          cstCofins: newProduct.tempTax.cstCofins || '07',
          baseCalculoCofins: calculatedValues.baseCalculoCofins,
          aliquotaCofins: newProduct.tempTax.aliquotaCofins || 0,
          valorCofins: calculatedValues.valorCofins,

          cstIpi: newProduct.tempTax.cstIpi || '53',
          baseCalculoIpi: calculatedValues.baseCalculoIpi,
          aliquotaIpi: newProduct.tempTax.aliquotaIpi || 0,
          valorIpi: calculatedValues.valorIpi,
          codigoEnquadramento: '999'
      };

      onAdd({
        ...newProduct as any, 
        id: crypto.randomUUID(),
        valorTotal: calculatedValues.valorTotal,
        codigo: newProduct.codigo || Math.floor(Math.random() * 10000).toString(),
        tax: taxData
      });

      setNewProduct(prev => ({
        ...prev,
        descricao: '',
        quantidade: 1,
        valorUnitario: 0,
        ncm: '',
        // Keep CFOP as it usually repeats
        codigo: '',
        gtin: 'SEM GTIN'
      }));
    }
  };

  const updateTax = (field: keyof TaxDetails, value: any) => {
      setNewProduct(prev => ({
          ...prev,
          tempTax: { ...prev.tempTax, [field]: value }
      }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                Novo Produto 
                <span className="ml-3 text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Regime: {issuerCrt === '1' ? 'Simples Nacional' : 'Regime Normal'}
                </span>
                {issuerUf && recipientUf && (
                    <span className="ml-2 text-xs font-normal bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {issuerUf === recipientUf ? 'Estadual (5)' : 'Interestadual (6)'}
                    </span>
                )}
            </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="md:col-span-6 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <div className="relative">
                <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={newProduct.descricao}
                    onChange={(e) => setNewProduct({ ...newProduct, descricao: e.target.value })}
                    placeholder="Ex: Caneta Esferográfica Azul"
                />
                <button
                    onClick={handleAiSuggestion}
                    disabled={loadingAi}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 hover:text-primary-800 disabled:opacity-50 p-1"
                    title="Usar IA para sugerir NCM"
                >
                    {loadingAi ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                </button>
            </div>
            {errorAi && <p className="text-xs text-red-500 mt-1">{errorAi}</p>}
          </div>

          <div className="md:col-span-3">
            <Input label="Código (SKU)" value={newProduct.codigo} onChange={(e) => setNewProduct({ ...newProduct, codigo: e.target.value })} />
          </div>
          <div className="md:col-span-3 relative">
             <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">GTIN / EAN <Barcode className="w-3 h-3 ml-1"/></label>
             <input className="w-full px-3 py-2 border border-gray-300 rounded-md" value={newProduct.gtin} onChange={(e) => setNewProduct({ ...newProduct, gtin: e.target.value })} placeholder="SEM GTIN" />
          </div>

          <div className="md:col-span-3">
            <Input label="NCM" value={newProduct.ncm} onChange={(e) => setNewProduct({ ...newProduct, ncm: e.target.value })} />
          </div>
          <div className="md:col-span-3">
             <Input label="CFOP" value={newProduct.cfop} onChange={(e) => setNewProduct({ ...newProduct, cfop: e.target.value })} />
          </div>

          <div className="md:col-span-2">
            <Input label="Qtd." type="number" value={newProduct.quantidade} onChange={(e) => setNewProduct({ ...newProduct, quantidade: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
             <Input label="Unidade" value={newProduct.unidade} onChange={(e) => setNewProduct({ ...newProduct, unidade: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Input label="Valor Unit. (R$)" type="number" step="0.01" value={newProduct.valorUnitario} onChange={(e) => setNewProduct({ ...newProduct, valorUnitario: Number(e.target.value) })} />
          </div>
        </div>

        {/* Tax Info */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><Calculator className="w-4 h-4 mr-2"/> Tributação</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Origem</label>
                    <select className="w-full text-sm border-gray-300 rounded-md p-2" value={newProduct.tempTax?.origem} onChange={e => updateTax('origem', e.target.value)}>
                        <option value="0">0 - Nacional</option>
                        <option value="1">1 - Importação direta</option>
                        <option value="2">2 - Adq. no mercado interno (Importado)</option>
                    </select>
                </div>

                {/* ICMS */}
                {issuerCrt === '1' ? (
                    <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">ICMS (Simples Nacional - CSOSN)</label>
                        <select className="w-full text-sm border-gray-300 rounded-md p-2" value={newProduct.tempTax?.csosn} onChange={e => updateTax('csosn', e.target.value)}>
                            <option value="101">101 - Trib. com permissão de crédito</option>
                            <option value="102">102 - Trib. sem permissão de crédito</option>
                            <option value="500">500 - ICMS cobrado ant. por ST</option>
                            <option value="900">900 - Outros</option>
                        </select>
                    </div>
                ) : (
                    <>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">CST ICMS (Regime Normal)</label>
                            <select className="w-full text-sm border-gray-300 rounded-md p-2" value={newProduct.tempTax?.cst} onChange={e => updateTax('cst', e.target.value)}>
                                <option value="00">00 - Tributada Integralmente</option>
                                <option value="20">20 - Com redução de BC</option>
                                <option value="40">40 - Isenta</option>
                                <option value="60">60 - Cobrado ant. por ST</option>
                                <option value="90">90 - Outros</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Aliq. ICMS (%)</label>
                            <input type="number" className="w-full text-sm border-gray-300 rounded-md p-2" value={newProduct.tempTax?.aliquotaIcms} onChange={e => updateTax('aliquotaIcms', Number(e.target.value))} />
                        </div>
                    </>
                )}

                {/* IPI */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">CST IPI</label>
                    <select className="w-full text-sm border-gray-300 rounded-md p-2" value={newProduct.tempTax?.cstIpi} onChange={e => updateTax('cstIpi', e.target.value)}>
                        <option value="50">50 - Saída Tributada</option>
                        <option value="51">51 - Saída Tributada (Aliq Zero)</option>
                        <option value="52">52 - Saída Isenta</option>
                        <option value="53">53 - Não Tributada</option>
                        <option value="99">99 - Outras</option>
                    </select>
                </div>
                {['50', '99'].includes(newProduct.tempTax?.cstIpi || '') && (
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Aliq. IPI (%)</label>
                        <input type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md p-2" value={newProduct.tempTax?.aliquotaIpi} onChange={e => updateTax('aliquotaIpi', Number(e.target.value))} />
                    </div>
                )}

                {/* PIS / COFINS */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">CST PIS/COFINS</label>
                    <select className="w-full text-sm border-gray-300 rounded-md p-2" value={newProduct.tempTax?.cstPis} onChange={e => { updateTax('cstPis', e.target.value); updateTax('cstCofins', e.target.value); }}>
                        <option value="01">01 - Operação Tributável</option>
                        <option value="07">07 - Operação Isenta</option>
                        <option value="49">49 - Outras Operações</option>
                    </select>
                </div>
                
                {['01', '02'].includes(newProduct.tempTax?.cstPis || '') && (
                    <>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Aliq. PIS (%)</label>
                            <input type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md p-2" value={newProduct.tempTax?.aliquotaPis} onChange={e => updateTax('aliquotaPis', Number(e.target.value))} />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Aliq. COF (%)</label>
                            <input type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md p-2" value={newProduct.tempTax?.aliquotaCofins} onChange={e => updateTax('aliquotaCofins', Number(e.target.value))} />
                        </div>
                    </>
                )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 flex flex-wrap gap-4">
                <span>ICMS: R$ {calculatedValues.valorIcms.toFixed(2)}</span>
                <span>IPI: R$ {calculatedValues.valorIpi.toFixed(2)}</span>
                <span>PIS: R$ {calculatedValues.valorPis.toFixed(2)}</span>
                <span>COFINS: R$ {calculatedValues.valorCofins.toFixed(2)}</span>
                <span className="font-bold text-gray-700">Valor Líquido: R$ {calculatedValues.valorTotal.toFixed(2)}</span>
            </div>
        </div>

        <div className="mt-4 flex justify-end">
             <button
                onClick={handleAdd}
                className="flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
             >
                 <Plus className="w-4 h-4 mr-2" />
                 Adicionar Item
             </button>
        </div>
      </div>

      {/* List Products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Itens da Nota ({products.length})</h3>
        </div>
        {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
                Nenhum produto adicionado. Use o formulário acima.
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                    <th className="px-6 py-3">Prod/Serv</th>
                    <th className="px-6 py-3">NCM/CFOP</th>
                    <th className="px-6 py-3">Tributação</th>
                    <th className="px-6 py-3">Qtd</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Ações</th>
                </tr>
                </thead>
                <tbody>
                {products.map((prod) => (
                    <tr key={prod.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{prod.descricao}</div>
                        <div className="text-xs text-gray-500">Cod: {prod.codigo} | GTIN: {prod.gtin}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                        <div>NCM: {prod.ncm}</div>
                        <div>CFOP: {prod.cfop}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                        {issuerCrt === '1' ? (
                            <span>CSOSN: {prod.tax.csosn}</span>
                        ) : (
                            <span>CST: {prod.tax.cst} ({prod.tax.aliquotaIcms}%)</span>
                        )}
                        <div className="text-gray-400">IPI: {prod.tax.cstIpi} | PIS/COF: {prod.tax.cstPis}</div>
                    </td>
                    <td className="px-6 py-4">{prod.quantidade} {prod.unidade} x R$ {prod.valorUnitario.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold">R$ {prod.valorTotal.toFixed(2)}</td>
                    <td className="px-6 py-4">
                        <button onClick={() => onRemove(prod.id)} className="text-red-500 hover:text-red-700 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
      </div>
    </div>
  );
};