import React from 'react';
import { InvoiceData, InvoiceTotals } from '../types';

interface DanfeProps {
  invoice: InvoiceData;
}

// CONFIGURAÇÃO: Quantos itens cabem por página sem quebrar o layout?
const ITENS_POR_PAGINA = 16; 

// --- HELPERS DE FORMATAÇÃO ---
const formatCurrency = (val: any) => {
  const n = typeof val === 'number' ? val : Number(String(val ?? '0').replace(',', '.'));
  return Number.isFinite(n) ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('pt-BR'); } catch { return dateStr; }
};

const formatChave = (ch44: string) => ch44 ? ch44.replace(/(\d{4})/g, '$1 ').trim() : '';
const onlyDigits = (v?: string) => String(v ?? '').replace(/\D/g, '');

const renderBarcode = (chaveAcesso44: string) => (
  <div className="h-10 w-full flex flex-col items-center justify-center bg-white border border-gray-300 mb-1 overflow-hidden">
    {/* Simulação visual de Código de Barras */}
    <div className="tracking-[4px] font-bold text-black scale-y-150 text-xs select-none">
        || |||||| |||| || ||||| |||| || |||||||| |||| | ||| || |||
    </div>
  </div>
);

// --- COMPONENTE DE CABEÇALHO (REPETE EM CADA PÁGINA) ---
const DanfeHeader = ({ invoice, pageIndex, totalPages }: { invoice: InvoiceData, pageIndex: number, totalPages: number }) => {
  const chave44 = onlyDigits(invoice.chaveAcesso || '').padEnd(44, '0').slice(0, 44);
  const natOp = invoice.natOp || 'VENDA DE MERCADORIA';
  const protocolo = invoice.protocoloAutorizacao 
    ? `${invoice.protocoloAutorizacao} - ${formatDate(invoice.historicoEventos?.find(e => e.tipo === 'autorizacao')?.data)}` 
    : 'NÃO HOMOLOGADA / EMISSÃO EM CONTINGÊNCIA';

  return (
    <>
      {/* Canhoto */}
      <div className="border border-black flex h-14 mb-2 text-[9px] break-inside-avoid">
        <div className="w-[20%] border-r border-black p-1 flex flex-col justify-between">
           <span className="font-bold uppercase">Recebemos de</span>
           <span className="truncate">{invoice.emitente.razaoSocial.substring(0, 35)}</span>
        </div>
        <div className="w-[60%] border-r border-black p-1 flex items-center justify-center text-center uppercase">
          os produtos/serviços constantes da nota fiscal indicada ao lado
        </div>
        <div className="w-[20%] p-1 flex flex-col items-center justify-center font-bold">
           <span className="text-lg">NF-e</span>
           <span>Nº {invoice.numero}</span>
           <span>SÉRIE {invoice.serie}</span>
        </div>
      </div>

      {/* Identificação Emitente + DANFE */}
      <div className="border border-black flex mb-2 h-36 break-inside-avoid">
        <div className="w-[42%] border-r border-black p-2 flex flex-col justify-center">
          <div className="font-bold text-sm uppercase mb-1 leading-tight">{invoice.emitente.razaoSocial}</div>
          <div className="text-[9px] leading-tight">
            {invoice.emitente.endereco.logradouro}, {invoice.emitente.endereco.numero}<br/>
            {invoice.emitente.endereco.bairro} - {invoice.emitente.endereco.municipio} / {invoice.emitente.endereco.uf}<br/>
            CEP: {invoice.emitente.endereco.cep}<br/>
          </div>
        </div>

        <div className="w-[13%] border-r border-black flex flex-col items-center justify-center p-1">
          <h1 className="font-bold text-xl">DANFE</h1>
          <div className="text-[7px] text-center leading-none mb-1">Documento Auxiliar<br/>da Nota Fiscal<br/>Eletrônica</div>
          <div className="flex w-full justify-around text-[9px] mb-1"><span>0-Entrada</span><span>1-Saída</span></div>
          <div className="border border-black px-3 py-0 text-lg font-bold mb-1">1</div>
          <div className="text-[9px] font-bold text-center leading-tight">
            Nº {invoice.numero}<br/>SÉRIE {invoice.serie}<br/>FL {pageIndex + 1}/{totalPages}
          </div>
        </div>

        <div className="w-[45%] p-2 flex flex-col justify-between">
           {renderBarcode(chave44)}
           <div>
             <div className="text-[9px] font-bold">CHAVE DE ACESSO</div>
             <div className="bg-gray-100 border border-gray-300 text-[10px] font-mono text-center px-1 tracking-tighter">
                {formatChave(chave44)}
             </div>
           </div>
           <div className="text-[9px] text-center mt-1 leading-tight">
              Consulta de autenticidade no portal nacional da NF-e<br/>www.nfe.fazenda.gov.br/portal
           </div>
        </div>
      </div>

      {/* Natureza e Inscrições */}
      <div className="border border-black flex mb-2 h-9 text-[10px] break-inside-avoid">
         <div className="w-[55%] border-r border-black p-1">
            <div className="text-[7px] font-bold text-gray-500">NATUREZA DA OPERAÇÃO</div>
            <div className="font-bold uppercase truncate">{natOp}</div>
         </div>
         <div className="w-[45%] p-1">
            <div className="text-[7px] font-bold text-gray-500">PROTOCOLO DE AUTORIZAÇÃO DE USO</div>
            <div className="font-bold">{protocolo}</div>
         </div>
      </div>

      <div className="border border-black flex mb-2 h-9 text-[10px] break-inside-avoid">
         <div className="w-[33%] border-r border-black p-1">
            <div className="text-[7px] font-bold text-gray-500">INSCRIÇÃO ESTADUAL</div>
            <div className="font-bold">{invoice.emitente.inscricaoEstadual}</div>
         </div>
         <div className="w-[33%] border-r border-black p-1">
            <div className="text-[7px] font-bold text-gray-500">INSC. ESTADUAL SUBST. TRIB.</div>
            <div className="font-bold"></div>
         </div>
         <div className="w-[34%] p-1">
            <div className="text-[7px] font-bold text-gray-500">CNPJ</div>
            <div className="font-bold">{invoice.emitente.cnpj}</div>
         </div>
      </div>

      {/* Destinatário */}
      <div className="bg-gray-200 border border-black border-b-0 px-2 py-0.5 font-bold text-[10px] print:bg-gray-300">DESTINATÁRIO / REMETENTE</div>
      <div className="border border-black flex flex-col text-[10px] mb-2 break-inside-avoid">
         <div className="flex border-b border-black">
            <div className="w-[50%] border-r border-black p-1">
               <div className="text-[7px] font-bold text-gray-500">NOME / RAZÃO SOCIAL</div>
               <div className="font-bold truncate">{invoice.destinatario.razaoSocial.toUpperCase()}</div>
            </div>
            <div className="w-[35%] border-r border-black p-1">
               <div className="text-[7px] font-bold text-gray-500">CNPJ / CPF</div>
               <div className="font-bold">{invoice.destinatario.cnpj}</div>
            </div>
            <div className="w-[15%] p-1">
               <div className="text-[7px] font-bold text-gray-500">DATA DA EMISSÃO</div>
               <div className="font-bold">{formatDate(invoice.dataEmissao)}</div>
            </div>
         </div>
         <div className="flex">
            <div className="w-[45%] border-r border-black p-1">
               <div className="text-[7px] font-bold text-gray-500">ENDEREÇO</div>
               <div className="font-bold truncate">{invoice.destinatario.endereco.logradouro}, {invoice.destinatario.endereco.numero}</div>
            </div>
            <div className="w-[25%] border-r border-black p-1">
               <div className="text-[7px] font-bold text-gray-500">BAIRRO / DISTRITO</div>
               <div className="font-bold truncate">{invoice.destinatario.endereco.bairro}</div>
            </div>
            <div className="w-[5%] border-r border-black p-1">
                <div className="text-[7px] font-bold text-gray-500">UF</div>
                <div className="font-bold">{invoice.destinatario.endereco.uf}</div>
            </div>
             <div className="w-[15%] border-r border-black p-1">
                <div className="text-[7px] font-bold text-gray-500">INSCRIÇÃO ESTADUAL</div>
                <div className="font-bold">{invoice.destinatario.inscricaoEstadual || 'ISENTO'}</div>
            </div>
            <div className="w-[10%] p-1">
                <div className="text-[7px] font-bold text-gray-500">DATA SAÍDA</div>
                <div className="font-bold">{formatDate(invoice.dataEmissao)}</div>
            </div>
         </div>
      </div>
    </>
  );
};

export const Danfe: React.FC<DanfeProps> = ({ invoice }) => {
  // 1. Lógica de Paginação (divide items em arrays de 16)
  const items = invoice.produtos || [];
  const productChunks = [];
  
  if (items.length === 0) {
    productChunks.push([]);
  } else {
    for (let i = 0; i < items.length; i += ITENS_POR_PAGINA) {
      productChunks.push(items.slice(i, i + ITENS_POR_PAGINA));
    }
  }

  const totalPages = productChunks.length;

  // 2. Totais Seguros
  const totaisDefaults: InvoiceTotals = { vBC: 0, vICMS: 0, vProd: 0, vIPI: 0, vPIS: 0, vCOFINS: 0, vNF: 0, vFrete: 0, vSeg: 0, vDesc: 0, vOutro: 0 } as any;
  const t = { ...totaisDefaults, ...(invoice.totais || {}) };

  return (
    <div id="danfe-printable-area" className="w-full bg-gray-500 py-8 print:p-0 print:bg-white flex flex-col items-center gap-8 print:block">
      
      {/* 🔥🔥🔥 CSS MÁGICO AQUI 🔥🔥🔥 
         Isso corrige o problema de cortar a página, mesmo sem arquivo global.
      */}
      <style>{`
        @media print {
          @page { size: A4; margin: 5mm; }
          
          /* Reseta o layout do Dashboard que esconde a rolagem */
          html, body, #root, #app {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
          }

          /* Esconde tudo na tela */
          body * {
            visibility: hidden;
            height: 0; 
            overflow: hidden;
          }

          /* Mostra e reseta o DANFE */
          #danfe-printable-area, #danfe-printable-area * {
            visibility: visible;
            height: auto;
            overflow: visible;
          }

          #danfe-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
          }

          /* Força quebra de página */
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
            display: block;
            height: 1px; /* Hack para forçar renderização do break */
            margin-bottom: 20px;
          }
        }
      `}</style>

      {productChunks.map((chunk, index) => {
        const isLastPage = index === totalPages - 1;

        return (
          <div 
            key={index} 
            className={`
              bg-white w-[210mm] h-[297mm] p-[8mm] shadow-lg relative flex flex-col
              print:shadow-none print:w-full print:h-[287mm] print:mb-0
              ${index < totalPages - 1 ? 'page-break' : ''}
            `}
          >
            {/* Cabeçalho Fixo */}
            <DanfeHeader invoice={invoice} pageIndex={index} totalPages={totalPages} />

            {/* Tabela de Produtos */}
            <div className="bg-gray-200 border border-black border-b-0 px-2 py-0.5 font-bold text-[10px] print:bg-gray-300 mt-1">DADOS DO PRODUTO / SERVIÇO</div>
            <div className="border border-black flex-1 relative flex flex-col">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-black text-[8px] h-5 bg-gray-50">
                    <th className="w-[10%] border-r border-black p-1 text-left">CÓDIGO</th>
                    <th className="w-[35%] border-r border-black p-1 text-left">DESCRIÇÃO</th>
                    <th className="w-[8%] border-r border-black p-1 text-center">NCM</th>
                    <th className="w-[5%] border-r border-black p-1 text-center">CST</th>
                    <th className="w-[5%] border-r border-black p-1 text-center">CFOP</th>
                    <th className="w-[5%] border-r border-black p-1 text-center">UN</th>
                    <th className="w-[8%] border-r border-black p-1 text-right">QTD</th>
                    <th className="w-[9%] border-r border-black p-1 text-right">V.UNIT</th>
                    <th className="w-[9%] border-r border-black p-1 text-right">V.TOTAL</th>
                    <th className="w-[6%] p-1 text-right">ICMS%</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((prod, i) => {
                    const tax = prod.tax || {};
                    const vTot = prod.valorTotal || (prod.quantidade * prod.valorUnitario);
                    return (
                      <tr key={i} className="border-b border-gray-200 text-[9px] h-6 align-middle">
                        <td className="border-r border-black px-1 truncate">{prod.codigo}</td>
                        <td className="border-r border-black px-1 truncate">{prod.descricao}</td>
                        <td className="border-r border-black px-1 text-center">{prod.ncm}</td>
                        <td className="border-r border-black px-1 text-center">{tax.cst || tax.csosn || '00'}</td>
                        <td className="border-r border-black px-1 text-center">{prod.cfop}</td>
                        <td className="border-r border-black px-1 text-center">{prod.unidade}</td>
                        <td className="border-r border-black px-1 text-right">{prod.quantidade}</td>
                        <td className="border-r border-black px-1 text-right">{prod.valorUnitario.toFixed(2)}</td>
                        <td className="border-r border-black px-1 text-right font-bold">{vTot.toFixed(2)}</td>
                        <td className="px-1 text-right">{(tax.aliquotaIcms ?? 0) > 0 ? tax.aliquotaIcms : ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!isLastPage && <div className="mt-auto border-t border-black text-center text-[9px] p-1 italic">CONTINUA NA PRÓXIMA PÁGINA</div>}
            </div>

            {/* Rodapé - Apenas na última página */}
            {isLastPage && (
              <div className="mt-2 no-break">
                 {/* CÁLCULO DO IMPOSTO (COMPLETO) */}
                 <div className="bg-gray-200 border border-black border-b-0 px-2 py-0.5 font-bold text-[10px] print:bg-gray-300">CÁLCULO DO IMPOSTO</div>
                 <div className="border border-black flex flex-wrap text-[9px] mb-2">
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                       <div className="text-[7px] font-bold text-gray-500">BASE CÁLC. ICMS</div>
                       <div className="font-bold text-right">{formatCurrency(t.vBC)}</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                       <div className="text-[7px] font-bold text-gray-500">VALOR ICMS</div>
                       <div className="font-bold text-right">{formatCurrency(t.vICMS)}</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                       <div className="text-[7px] font-bold text-gray-500">BASE ICMS ST</div>
                       <div className="font-bold text-right">R$ 0,00</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                       <div className="text-[7px] font-bold text-gray-500">VALOR ICMS ST</div>
                       <div className="font-bold text-right">R$ 0,00</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                       <div className="text-[7px] font-bold text-gray-500">VALOR PIS</div>
                       <div className="font-bold text-right">{formatCurrency(t.vPIS)}</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                       <div className="text-[7px] font-bold text-gray-500">VALOR COFINS</div>
                       <div className="font-bold text-right">{formatCurrency(t.vCOFINS)}</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                       <div className="text-[7px] font-bold text-gray-500">VALOR IPI</div>
                       <div className="font-bold text-right">{formatCurrency(t.vIPI)}</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-b border-black">
                       <div className="text-[7px] font-bold text-gray-500">VALOR TOTAL PROD.</div>
                       <div className="font-bold text-right">{formatCurrency(t.vProd)}</div>
                    </div>

                    {/* Linha 2 Totais */}
                    <div className="w-[20%] p-1 border-r border-black">
                       <div className="text-[7px] font-bold text-gray-500">VALOR DO FRETE</div>
                       <div className="font-bold text-right">{formatCurrency(t.vFrete)}</div>
                    </div>
                    <div className="w-[20%] p-1 border-r border-black">
                       <div className="text-[7px] font-bold text-gray-500">VALOR DO SEGURO</div>
                       <div className="font-bold text-right">{formatCurrency(t.vSeg)}</div>
                    </div>
                    <div className="w-[20%] p-1 border-r border-black">
                       <div className="text-[7px] font-bold text-gray-500">DESCONTO</div>
                       <div className="font-bold text-right">{formatCurrency(t.vDesc)}</div>
                    </div>
                    <div className="w-[20%] p-1 border-r border-black">
                       <div className="text-[7px] font-bold text-gray-500">OUTRAS DESPESAS</div>
                       <div className="font-bold text-right">{formatCurrency(t.vOutro)}</div>
                    </div>
                    <div className="w-[20%] p-1 bg-gray-100">
                       <div className="text-[7px] font-bold text-gray-500">VALOR TOTAL NOTA</div>
                       <div className="font-bold text-right text-lg">{formatCurrency(t.vNF)}</div>
                    </div>
                 </div>

                 {/* TRANSPORTADOR */}
                 <div className="bg-gray-200 border border-black border-b-0 px-2 py-0.5 font-bold text-[10px] print:bg-gray-300">TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
                 <div className="border border-black flex h-14 text-[9px] mb-2">
                    <div className="w-[30%] border-r border-black p-1">
                        <div className="text-[7px] font-bold text-gray-500">RAZÃO SOCIAL</div>
                        <div>{invoice.globalValues.modalidadeFrete === '0' ? invoice.emitente.razaoSocial : invoice.globalValues.modalidadeFrete === '1' ? invoice.destinatario.razaoSocial : ''}</div>
                    </div>
                    <div className="w-[15%] border-r border-black p-1">
                        <div className="text-[7px] font-bold text-gray-500">FRETE POR CONTA</div>
                        <div className="font-bold">
                            {invoice.globalValues.modalidadeFrete === '9' ? '9-SEM FRETE' : 
                             invoice.globalValues.modalidadeFrete === '0' ? '0-EMITENTE' : '1-DESTINAT.'}
                        </div>
                    </div>
                    <div className="w-[10%] border-r border-black p-1">
                        <div className="text-[7px] font-bold text-gray-500">CÓDIGO ANTT</div>
                    </div>
                    <div className="w-[15%] border-r border-black p-1">
                        <div className="text-[7px] font-bold text-gray-500">PLACA DO VEÍCULO</div>
                    </div>
                    <div className="w-[10%] border-r border-black p-1">
                        <div className="text-[7px] font-bold text-gray-500">UF</div>
                    </div>
                    <div className="w-[20%] p-1">
                        <div className="text-[7px] font-bold text-gray-500">CNPJ/CPF</div>
                    </div>
                 </div>

                 {/* DADOS ADICIONAIS */}
                 <div className="bg-gray-200 border border-black border-b-0 px-2 py-0.5 font-bold text-[10px] print:bg-gray-300">DADOS ADICIONAIS</div>
                 <div className="border border-black h-24 p-1">
                    <div className="text-[7px] font-bold text-gray-500">INFORMAÇÕES COMPLEMENTARES</div>
                    <div className="text-[9px] font-mono leading-tight whitespace-pre-wrap mt-1">
                        {invoice.informacoesComplementares}
                        {invoice.finalidade === '2' && ` REF NF: ${invoice.refNFe}`}
                    </div>
                 </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  );
};
