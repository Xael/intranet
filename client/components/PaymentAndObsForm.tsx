import React, { useEffect } from 'react';
import { InvoiceData, PaymentMethod, GlobalValues } from '../types';
import { Plus, Trash2, CreditCard, DollarSign, Truck } from 'lucide-react';

interface Props {
  data: InvoiceData;
  onChange: (d: InvoiceData) => void;
}

export const PaymentAndObsForm: React.FC<Props> = ({ data, onChange }) => {
  
  useEffect(() => {
    if (data.emitente.crt === '1' && !data.informacoesComplementares) {
        const legalText = "DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL.\nNÃO GERA DIREITO A CRÉDITO FISCAL DE IPI.";
        onChange({
            ...data,
            informacoesComplementares: legalText
        });
    }
  }, []); 

  const addPayment = () => {
    const currentTotal = data.pagamento.reduce((acc, p) => acc + p.vPag, 0);
    const remaining = Math.max(0, data.totais.vNF - currentTotal);
    
    onChange({
        ...data,
        pagamento: [...data.pagamento, { tPag: '01', vPag: remaining }]
    });
  };

  const removePayment = (index: number) => {
    const newPayments = [...data.pagamento];
    newPayments.splice(index, 1);
    onChange({ ...data, pagamento: newPayments });
  };

  const updatePayment = (index: number, field: keyof PaymentMethod, value: any) => {
    const newPayments = [...data.pagamento];
    newPayments[index] = { ...newPayments[index], [field]: value };
    onChange({ ...data, pagamento: newPayments });
  };

  const updateGlobal = (field: keyof GlobalValues, value: any) => {
      onChange({
          ...data,
          globalValues: {
              ...data.globalValues,
              [field]: value
          }
      });
  };

  const paymentMethods = [
      { code: '01', label: 'Dinheiro' },
      { code: '03', label: 'Cartão de Crédito' },
      { code: '04', label: 'Cartão de Débito' },
      { code: '15', label: 'Boleto Bancário' },
      { code: '16', label: 'Depósito Bancário' },
      { code: '17', label: 'PIX' },
      { code: '90', label: 'Sem Pagamento' },
      { code: '99', label: 'Outros' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
        
        {/* Logistics & Values */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-indigo-600"/> Logística e Valores Agregados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade Frete</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value={data.globalValues?.modalidadeFrete || '9'}
                        onChange={(e) => updateGlobal('modalidadeFrete', e.target.value)}
                    >
                        <option value="0">0 - Por conta do Emitente (CIF)</option>
                        <option value="1">1 - Por conta do Destinatário (FOB)</option>
                        <option value="9">9 - Sem Ocorrência de Frete</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Frete (R$)</label>
                    <input 
                        type="number" step="0.01" 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value={data.globalValues?.frete || 0}
                        onChange={(e) => updateGlobal('frete', Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Seguro (R$)</label>
                    <input 
                        type="number" step="0.01" 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value={data.globalValues?.seguro || 0}
                        onChange={(e) => updateGlobal('seguro', Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desconto Global (R$)</label>
                    <input 
                        type="number" step="0.01" 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-red-600"
                        value={data.globalValues?.desconto || 0}
                        onChange={(e) => updateGlobal('desconto', Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outras Desp. (R$)</label>
                    <input 
                        type="number" step="0.01" 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value={data.globalValues?.outrasDespesas || 0}
                        onChange={(e) => updateGlobal('outrasDespesas', Number(e.target.value))}
                    />
                </div>
            </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600"/> Totais da Nota
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                    <span className="block text-gray-500 text-xs uppercase">Base Cálc. ICMS</span>
                    <span className="font-semibold">R$ {data.totais.vBC.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                    <span className="block text-gray-500 text-xs uppercase">Valor ICMS</span>
                    <span className="font-semibold">R$ {data.totais.vICMS.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                    <span className="block text-gray-500 text-xs uppercase">Valor IPI</span>
                    <span className="font-semibold">R$ {data.totais.vIPI.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                    <span className="block text-gray-500 text-xs uppercase">Valor PIS</span>
                    <span className="font-semibold">R$ {data.totais.vPIS.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                    <span className="block text-gray-500 text-xs uppercase">Valor COFINS</span>
                    <span className="font-semibold">R$ {data.totais.vCOFINS.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded border border-blue-100 col-span-2 md:col-span-1 text-center">
                    <span className="block text-blue-600 text-xs uppercase font-bold">Total (vNF)</span>
                    <span className="font-bold text-xl text-blue-800">R$ {data.totais.vNF.toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* Payments */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-primary-600"/> Formas de Pagamento
                </h3>
                <button onClick={addPayment} className="text-sm flex items-center text-primary-600 hover:text-primary-800">
                    <Plus className="w-4 h-4 mr-1"/> Adicionar
                </button>
            </div>

            {data.pagamento.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">Nenhum pagamento informado.</p>
            ) : (
                <div className="space-y-3">
                    {data.pagamento.map((pag, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-gray-200">
                            <select 
                                className="flex-1 p-2 border border-gray-300 rounded text-sm"
                                value={pag.tPag}
                                onChange={(e) => updatePayment(idx, 'tPag', e.target.value)}
                            >
                                {paymentMethods.map(m => <option key={m.code} value={m.code}>{m.code} - {m.label}</option>)}
                            </select>
                            <div className="w-32">
                                <input 
                                    type="number" step="0.01"
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                    value={pag.vPag}
                                    onChange={(e) => updatePayment(idx, 'vPag', Number(e.target.value))}
                                />
                            </div>
                            <button onClick={() => removePayment(idx)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-2 text-right text-xs text-gray-500">
                Total Pagamentos: R$ {data.pagamento.reduce((acc, p) => acc + p.vPag, 0).toFixed(2)}
            </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações Adicionais</h3>
            <textarea
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 h-32 text-sm"
                placeholder="Informações Complementares de interesse do contribuinte (Lei da Transparência, Pedido, Vendedor...)"
                value={data.informacoesComplementares}
                onChange={(e) => onChange({...data, informacoesComplementares: e.target.value})}
            />
        </div>
    </div>
  );
};