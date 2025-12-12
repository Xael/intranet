import React from 'react';
import { InvoiceData } from '../types';

interface DanfeProps {
  invoice: InvoiceData;
}

// Helper para simular a renderização do código de barras (necessita de biblioteca externa)
const renderBarcode = (chaveAcesso: string) => {
    // Usamos um div placeholder. Um script JsBarcode(element, chaveAcesso) rodaria aqui.
    return (
        <div className="h-10 w-full flex items-center justify-center bg-white">
             {/* Simulação visual do código de barras: use uma biblioteca real para produção */}
             <div className="text-[10px] text-gray-500 font-mono tracking-widest overflow-hidden">
                 {chaveAcesso ? chaveAcesso.substring(0, 44).replace(/(\d{4})/g, '$1 ').trim() : 'CHAVE DE ACESSO (MOCK)'}
             </div>
        </div>
    );
};

export const Danfe: React.FC<DanfeProps> = ({ invoice }) => {
  const formatCurrency = (val: number | undefined) => (typeof val === 'number' && !isNaN(val)) ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
  const formatDate = (dateStr: string) => {
      try { return new Date(dateStr).toLocaleDateString('pt-BR'); } catch { return dateStr; }
  };
    
  // Garante que os totais sejam números
  const totais = invoice.totais || {};
  const vBC = totais.vBC || 0;
  const vICMS = totais.vICMS || 0;
  const vPIS = totais.vPIS || 0;
  const vCOFINS = totais.vCOFINS || 0;
  const vProd = totais.vProd || 0;
  const vNF = totais.vNF || 0;
  const vFrete = totais.vFrete || 0;
  const vSeg = totais.vSeg || 0;
  const vDesc = totais.vDesc || 0;
  const vOutro = totais.vOutro || 0;
  const vIPI = totais.vIPI || 0;
  
  return (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto text-[10px] leading-tight font-sans border border-gray-300 print:border-0 print:p-0" id="danfe-area">
      
      {/* Header / Canhoto */}
      <div className="border border-black mb-2 flex">
        <div className="flex-1 p-2 border-r border-black">
            <div className="text-[9px] mb-4">RECEBEMOS DE {invoice.emitente.razaoSocial.toUpperCase()} OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO</div>
            <div className="flex mt-4 items-end">
                <div className="border-t border-black w-32 mr-4 text-center">DATA DE RECEBIMENTO</div>
                <div className="border-t border-black flex-1 text-center">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</div>
            </div>
        </div>
        <div className="w-32 p-2 flex flex-col justify-center items-center">
            <div className="font-bold text-lg">NF-e</div>
            <div className="text-sm">Nº {invoice.numero}</div>
            <div className="text-sm">SÉRIE {invoice.serie}</div>
        </div>
      </div>

      <div className="border-b-2 border-dashed border-black my-2"></div>

      {/* Main Header */}
      <div className="border border-black flex mb-2">
        <div className="w-5/12 p-2 border-r border-black flex flex-col">
            <div className="font-bold text-lg mb-1">{invoice.emitente.razaoSocial.toUpperCase()}</div>
            <div>{invoice.emitente.endereco.logradouro}, {invoice.emitente.endereco.numero}</div>
            <div>{invoice.emitente.endereco.bairro} - {invoice.emitente.endereco.municipio} / {invoice.emitente.endereco.uf}</div>
            <div>CEP: {invoice.emitente.endereco.cep}</div>
        </div>

        <div className="w-2/12 p-2 border-r border-black flex flex-col items-center justify-center text-center">
            <div className="font-bold text-xl">DANFE</div>
            <div className="text-[8px]">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</div>
            <div className="flex w-full justify-between px-2 my-2">
                <div>0 - Entrada<br/>1 - Saída</div>
                <div className="border border-black px-2 py-1 font-bold text-lg">1</div>
            </div>
            <div className="font-bold">Nº {invoice.numero}</div>
            <div className="font-bold">SÉRIE {invoice.serie}</div>
        </div>

        <div className="w-5/12 p-2 flex flex-col">
            {renderBarcode(invoice.chaveAcesso || '')}
             
            <div className="font-bold text-center text-xs mt-2 mb-2">CHAVE DE ACESSO</div>
            <div className="text-center font-mono text-xs bg-gray-100 p-1 border border-gray-200 rounded">
                {invoice.chaveAcesso?.replace(/(\d{4})/g, '$1 ').trim() || '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000'}
            </div>
            <div className="mt-2 text-center text-[9px]">
                Consulta de autenticidade no portal nacional da NF-e
            </div>
        </div>
      </div>

      <div className="border border-black flex mb-2">
        <div className="w-7/12 p-1 border-r border-black">
            <div className="text-[8px]">NATUREZA DA OPERAÇÃO</div>
            <div className="font-bold">VENDA DE MERCADORIA</div>
        </div>
        <div className="w-5/12 p-1">
            <div className="text-[8px]">PROTOCOLO DE AUTORIZAÇÃO DE USO</div>
            <div className="font-bold">135230000123456 - {formatDate(invoice.dataEmissao)}</div>
        </div>
      </div>

      <div className="border border-black flex mb-2">
        <div className="w-4/12 p-1 border-r border-black">
            <div className="text-[8px]">INSCRIÇÃO ESTADUAL</div>
            <div className="font-bold">{invoice.emitente.inscricaoEstadual}</div>
        </div>
        <div className="w-4/12 p-1 border-r border-black">
            <div className="text-[8px]">INSC. ESTADUAL DO SUBST. TRIBUTÁRIO</div>
            <div className="font-bold"></div>
        </div>
        <div className="w-4/12 p-1">
            <div className="text-[8px]">CNPJ</div>
            <div className="font-bold">{invoice.emitente.cnpj}</div>
        </div>
      </div>

      {/* Destinatario */}
      <div className="font-bold text-xs bg-gray-200 border border-black border-b-0 p-1">DESTINATÁRIO / REMETENTE</div>
      <div className="border border-black flex flex-wrap mb-2">
        <div className="w-7/12 p-1 border-r border-b border-black">
            <div className="text-[8px]">NOME / RAZÃO SOCIAL</div>
            <div className="font-bold">{invoice.destinatario.razaoSocial.toUpperCase()}</div>
        </div>
        <div className="w-3/12 p-1 border-r border-b border-black">
            <div className="text-[8px]">CNPJ / CPF</div>
            <div className="font-bold">{invoice.destinatario.cnpj}</div>
        </div>
        <div className="w-2/12 p-1 border-b border-black">
            <div className="text-[8px]">DATA DA EMISSÃO</div>
            <div className="font-bold">{formatDate(invoice.dataEmissao)}</div>
        </div>

        <div className="w-6/12 p-1 border-r border-black">
            <div className="text-[8px]">ENDEREÇO</div>
            <div className="font-bold">{invoice.destinatario.endereco.logradouro}, {invoice.destinatario.endereco.numero}</div>
        </div>
        <div className="w-3/12 p-1 border-r border-black">
            <div className="text-[8px]">BAIRRO / DISTRITO</div>
            <div className="font-bold">{invoice.destinatario.endereco.bairro}</div>
        </div>
        <div className="w-1/12 p-1 border-r border-black">
            <div className="text-[8px]">CEP</div>
            <div className="font-bold">{invoice.destinatario.endereco.cep}</div>
        </div>
        <div className="w-2/12 p-1">
            <div className="text-[8px]">DATA DE SAÍDA</div>
            <div className="font-bold">{formatDate(invoice.dataEmissao)}</div>
        </div>
      </div>

      {/* Totais */}
      <div className="font-bold text-xs bg-gray-200 border border-black border-b-0 p-1">CÁLCULO DO IMPOSTO</div>
      <div className="border border-black flex mb-2 flex-wrap">
         <div className="w-[12.5%] p-1 border-r border-b border-black">
             <div className="text-[8px]">BASE DE CÁLC. DO ICMS</div>
             <div className="font-bold text-right">{formatCurrency(vBC)}</div>
         </div>
         <div className="w-[12.5%] p-1 border-r border-b border-black">
             <div className="text-[8px]">VALOR DO ICMS</div>
             <div className="font-bold text-right">{formatCurrency(vICMS)}</div>
         </div>
         <div className="w-[12.5%] p-1 border-r border-b border-black">
             <div className="text-[8px]">BASE CÁLC. ICMS ST</div>
             <div className="font-bold text-right">R$ 0,00</div>
         </div>
         <div className="w-[12.5%] p-1 border-r border-b border-black">
             <div className="text-[8px]">VALOR DO ICMS ST</div>
             <div className="font-bold text-right">R$ 0,00</div>
         </div>
         <div className="w-[12.5%] p-1 border-r border-b border-black">
             <div className="text-[8px]">VALOR PIS</div>
             <div className="font-bold text-right">{formatCurrency(vPIS)}</div>
         </div>
         <div className="w-[12.5%] p-1 border-r border-b border-black">
             <div className="text-[8px]">VALOR COFINS</div>
             <div className="font-bold text-right">{formatCurrency(vCOFINS)}</div>
         </div>
         <div className="w-[12.5%] p-1 border-r border-b border-black">
             <div className="text-[8px]">VALOR TOTAL PROD.</div>
             <div className="font-bold text-right">{formatCurrency(vProd)}</div>
         </div>
         <div className="w-[12.5%] p-1 border-b border-black">
             <div className="text-[8px]">VALOR TOTAL NOTA</div>
             <div className="font-bold text-right">{formatCurrency(vNF)}</div>
         </div>

         {/* Second Row Totals */}
         <div className="w-[20%] p-1 border-r border-black">
             <div className="text-[8px]">VALOR DO FRETE</div>
             <div className="font-bold text-right">{formatCurrency(vFrete)}</div>
         </div>
         <div className="w-[20%] p-1 border-r border-black">
             <div className="text-[8px]">VALOR DO SEGURO</div>
             <div className="font-bold text-right">{formatCurrency(vSeg)}</div>
         </div>
         <div className="w-[20%] p-1 border-r border-black">
             <div className="text-[8px]">DESCONTO</div>
             <div className="font-bold text-right">{formatCurrency(vDesc)}</div>
         </div>
         <div className="w-[20%] p-1 border-r border-black">
             <div className="text-[8px]">OUTRAS DESP.</div>
             <div className="font-bold text-right">{formatCurrency(vOutro)}</div>
         </div>
         <div className="w-[20%] p-1">
             <div className="text-[8px]">VALOR DO IPI</div>
             <div className="font-bold text-right">{formatCurrency(vIPI)}</div>
         </div>
      </div>

      {/* Produtos */}
      <div className="font-bold text-xs bg-gray-200 border border-black border-b-0 p-1">DADOS DO PRODUTO / SERVIÇO</div>
      <div className="border border-black mb-2 min-h-[300px]">
        <table className="w-full text-left table-fixed">
            <thead>
                <tr className="border-b border-black">
                    {/* Larguras ajustadas para evitar estouro */}
                    <th className="text-[8px] font-normal p-1 w-[10%] border-r border-black">CÓDIGO</th> 
                    <th className="text-[8px] font-normal p-1 w-[35%] border-r border-black">DESCRIÇÃO</th>
                    <th className="text-[8px] font-normal p-1 w-[6%] border-r border-black">NCM</th>
                    <th className="text-[8px] font-normal p-1 w-[5%] border-r border-black">CST</th>
                    <th className="text-[8px] font-normal p-1 w-[5%] border-r border-black">CFOP</th>
                    <th className="text-[8px] font-normal p-1 w-[5%] border-r border-black">UNID</th>
                    <th className="text-[8px] font-normal p-1 w-[6%] border-r border-black text-right">QTD</th>
                    <th className="text-[8px] font-normal p-1 w-[10%] border-r border-black text-right">V.UNIT</th>
                    <th className="text-[8px] font-normal p-1 w-[10%] text-right border-r border-black">V.TOTAL</th>
                    <th className="text-[8px] font-normal p-1 w-[5%] text-right border-r border-black">ICMS</th>
                    <th className="text-[8px] font-normal p-1 w-[3%] text-right">IPI</th>
                </tr>
            </thead>
            <tbody>
                {invoice.produtos.map((prod, i) => (
                    <tr key={i} className="border-b border-gray-300">
                        {/* Aplicando overflow-hidden e whitespace-nowrap para impedir o atropelamento */}
                        <td className="p-1 border-r border-gray-300 w-[10%] whitespace-nowrap overflow-hidden text-ellipsis">{prod.codigo}</td>
                        <td className="p-1 border-r border-gray-300 w-[35%] overflow-hidden whitespace-nowrap text-ellipsis">{prod.descricao}</td>
                        <td className="p-1 border-r border-gray-300 w-[6%]">{prod.ncm}</td>
                        <td className="p-1 border-r border-gray-300 w-[5%]">{invoice.emitente.crt === '1' ? prod.tax.csosn : prod.tax.cst}</td>
                        <td className="p-1 border-r border-gray-300 w-[5%]">{prod.cfop}</td>
                        <td className="p-1 border-r border-gray-300 w-[5%]">{prod.unidade}</td>
                        <td className="p-1 border-r border-gray-300 w-[6%] text-right">{prod.quantidade}</td>
                        <td className="p-1 border-r border-gray-300 w-[10%] text-right">{prod.valorUnitario.toFixed(2)}</td>
                        <td className="p-1 border-r border-gray-300 w-[10%] text-right">{prod.valorTotal.toFixed(2)}</td>
                        <td className="p-1 border-r border-gray-300 w-[5%] text-right">{prod.tax.aliquotaIcms > 0 ? `${prod.tax.aliquotaIcms}%` : '-'}</td>
                        <td className="p-1 w-[3%] text-right">{prod.tax.aliquotaIpi ? `${prod.tax.aliquotaIpi}%` : '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Dados Adicionais */}
      <div className="font-bold text-xs bg-gray-200 border border-black border-b-0 p-1">DADOS ADICIONAIS</div>
      <div className="border border-black h-24 p-1">
        <div className="text-[8px]">INFORMAÇÕES COMPLEMENTARES</div>
        <div className="text-[10px] whitespace-pre-wrap">
            {invoice.informacoesComplementares}
            {invoice.finalidade === '2' && ` NOTA FISCAL COMPLEMENTAR REFERENTE À NF ${invoice.refNFe}.`}
    1435:         {invoice.finalidade === '4' && ` NOTA FISCAL DE DEVOLUÇÃO REFERENTE À NF ${invoice.refNFe}.`}
        </div>
      </div>

      {invoice.status === 'cancelled' && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-red-500 text-red-500 font-bold text-6xl opacity-50 rotate-[-45deg] p-4 pointer-events-none">
              CANCELADA
          </div>
      )}
    </div>
  );
};
