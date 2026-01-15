import React from 'react';
import { InvoiceData } from '../types';

interface DanfeProps {
  invoice: InvoiceData;
}

// Configuração: Quantos produtos cabem confortavelmente em uma folha A4 com este layout?
const ITENS_POR_PAGINA = 16; 

// --- HELPERS ---
const formatCurrency = (val: any) => {
  const n = typeof val === 'number' ? val : Number(String(val ?? '0').replace(',', '.'));
  return Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00';
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
};

const formatChave = (ch44: string) =>
  ch44 ? ch44.replace(/(\d{4})/g, '$1 ').trim() : '';

const renderBarcode = (chaveAcesso44: string) => {
  return (
    <div className="h-10 w-full flex items-center justify-center bg-white border border-gray-300 mb-1">
      <div className="text-[10px] text-gray-500 font-mono tracking-widest overflow-hidden text-center">
        {/* Simulação visual de código de barras */}
        <div className="tracking-[2px] font-bold text-black scale-y-150 opacity-80">
           ||| |||| ||||| || |||| ||| |||| ||||| ||| ||| |||| |||| 
        </div>
        <span className="text-[9px] tracking-normal font-bold">{formatChave(chaveAcesso44)}</span>
      </div>
    </div>
  );
};

// --- COMPONENTE DE CABEÇALHO (Repete em todas as páginas) ---
const DanfeHeader = ({ invoice, pageIndex, totalPages }: { invoice: InvoiceData, pageIndex: number, totalPages: number }) => (
  <>
    {/* Canhoto - Apenas na primeira página (opcional, aqui deixei em todas para garantir layout fixo) */}
    <div className="border border-black flex text-[10px] mb-2 h-16 break-inside-avoid">
      <div className="w-[20%] border-r border-black p-1 flex flex-col justify-between">
        <span className="uppercase font-bold">Recebemos de</span>
        <span className="font-bold truncate text-[9px]">{invoice.emitente.razaoSocial.substring(0, 45)}</span>
      </div>
      <div className="w-[60%] border-r border-black p-1 flex flex-col justify-center items-center text-center">
        <span className="uppercase text-[9px]">os produtos/serviços constantes da nota fiscal indicada ao lado</span>
      </div>
      <div className="w-[20%] p-1 flex flex-col justify-center items-center">
        <span className="font-bold text-lg">NF-e</span>
        <span className="font-bold text-md">Nº {invoice.numero}</span>
        <span className="font-bold">Série {invoice.serie}</span>
      </div>
    </div>

    {/* Dados do Emitente e DANFE */}
    <div className="border border-black flex mb-2 h-36 break-inside-avoid">
      {/* Logotipo / Emitente */}
      <div className="w-[42%] border-r border-black p-2 flex flex-col justify-center">
        <div className="font-bold text-sm uppercase leading-tight mb-2">{invoice.emitente.razaoSocial}</div>
        <div className="text-[9px] mt-1 leading-tight">
          {invoice.emitente.endereco.logradouro}, {invoice.emitente.endereco.numero}
          <br />{invoice.emitente.endereco.bairro} - {invoice.emitente.endereco.municipio}/{invoice.emitente.endereco.uf}
          <br />CEP: {invoice.emitente.endereco.cep}
          <br />CNPJ: {invoice.emitente.cnpj} <span className="ml-2">IE: {invoice.emitente.inscricaoEstadual}</span>
        </div>
      </div>

      {/* DANFE Grande */}
      <div className="w-[13%] border-r border-black flex flex-col items-center justify-center p-1">
        <h1 className="font-bold text-xl">DANFE</h1>
        <div className="text-[7px] text-center leading-tight mb-1">Documento Auxiliar<br />da Nota Fiscal<br />Eletrônica</div>
        <div className="flex w-full justify-around text-[9px] font-bold mb-1 px-1">
          <span>0-Entrada</span>
          <span>1-Saída</span>
        </div>
        <div className="border border-black px-3 py-0 text-lg font-bold mb-1">1</div>
        <div className="text-[9px] font-bold leading-tight text-center">
          Nº {invoice.numero}<br />
          SÉRIE {invoice.serie}<br />
          FL {pageIndex + 1}/{totalPages}
        </div>
      </div>

      {/* Chave e Consulta */}
      <div className="w-[45%] p-2 flex flex-col justify-between">
        {renderBarcode(invoice.chaveAcesso || '')}
        
        <div>
           <div className="text-[9px] font-bold mb-0.5">Chave de Acesso</div>
           <div className="border border-black px-1 py-1 text-[10px] font-mono text-center bg-gray-50 tracking-tighter">
             {formatChave(invoice.chaveAcesso || '00000000000000000000000000000000000000000000')}
           </div>
        </div>
        
        <div className="text-[9px] text-center text-gray-600 leading-tight mt-1">
          Consulta de autenticidade no portal nacional da NF-e<br />
          www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora
        </div>
      </div>
    </div>

    {/* Natureza e Protocolo */}
    <div className="border border-black flex text-[10px] mb-2 h-9 break-inside-avoid items-center">
      <div className="w-[60%] border-r border-black p-1 h-full">
        <div className="font-bold text-[7px] text-gray-500">NATUREZA DA OPERAÇÃO</div>
        <div className="uppercase font-bold">{invoice.natOp || 'VENDA DE MERCADORIA'}</div>
      </div>
      <div className="w-[40%] p-1 h-full">
        <div className="font-bold text-[7px] text-gray-500">PROTOCOLO DE AUTORIZAÇÃO DE USO</div>
        <div className="font-bold">
          {invoice.protocoloAutorizacao 
            ? `${invoice.protocoloAutorizacao} - ${formatDate(invoice.historicoEventos?.find(e => e.tipo === 'autorizacao')?.data || new Date().toISOString())}`
            : 'EMISSÃO EM HOMOLOGAÇÃO - SEM VALOR FISCAL'}
        </div>
      </div>
    </div>

    {/* Destinatário */}
    <div className="font-bold text-[10px] bg-gray-200 border border-black border-b-0 p-0.5 px-2 print:bg-gray-300">DESTINATÁRIO / REMETENTE</div>
    <div className="border border-black flex flex-col text-[10px] mb-2 break-inside-avoid">
      <div className="flex border-b border-black">
        <div className="w-[50%] border-r border-black p-1">
          <div className="text-[7px] font-bold text-gray-500">NOME / RAZÃO SOCIAL</div>
          <div className="truncate font-bold">{invoice.destinatario.razaoSocial.toUpperCase()}</div>
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
          <div className="truncate text-[9px]">{invoice.destinatario.endereco.logradouro}, {invoice.destinatario.endereco.numero}</div>
        </div>
        <div className="w-[25%] border-r border-black p-1">
          <div className="text-[7px] font-bold text-gray-500">BAIRRO / DISTRITO</div>
          <div className="truncate text-[9px]">{invoice.destinatario.endereco.bairro}</div>
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

// --- COMPONENTE PRINCIPAL ---
export const Danfe: React.FC<DanfeProps> = ({ invoice }) => {
  
  // Divide os produtos em páginas
  const productChunks = [];
  const items = invoice.produtos || [];
  
  if (items.length === 0) {
    productChunks.push([]); 
  } else {
    for (let i = 0; i < items.length; i += ITENS_POR_PAGINA) {
      productChunks.push(items.slice(i, i + ITENS_POR_PAGINA));
    }
  }

  const totalPages = productChunks.length;

  return (
    <div className="w-full bg-gray-500 py-8 print:p-0 print:bg-white flex flex-col items-center gap-8 print:block">
      <style>{`
        @media print {
          @page { size: A4; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-after: always; }
          .no-break { break-inside: avoid; }
        }
      `}</style>

      {productChunks.map((chunk, index) => {
        const isLastPage = index === totalPages - 1;
        
        return (
          <div 
            key={index} 
            className={`
              bg-white w-[210mm] h-[297mm] p-[8mm] shadow-lg print:shadow-none print:w-full print:h-auto print:min-h-[285mm] relative flex flex-col
              ${index < totalPages - 1 ? 'page-break' : ''}
            `}
          >
            {/* Cabeçalho Fixo */}
            <DanfeHeader invoice={invoice} pageIndex={index} totalPages={totalPages} />

            {/* Tabela de Produtos */}
            <div className="font-bold text-[10px] bg-gray-200 border border-black border-b-0 p-0.5 px-2 mt-1 print:bg-gray-300">DADOS DO PRODUTO / SERVIÇO</div>
            <div className="border border-black flex-1 text-[9px] relative flex flex-col">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-black text-[8px] h-6">
                    <th className="w-[10%] border-r border-black text-left p-1">CÓDIGO</th>
                    <th className="w-[35%] border-r border-black text-left p-1">DESCRIÇÃO</th>
                    <th className="w-[8%] border-r border-black p-1 text-center">NCM</th>
                    <th className="w-[5%] border-r border-black p-1 text-center">CST</th>
                    <th className="w-[5%] border-r border-black p-1 text-center">CFOP</th>
                    <th className="w-[5%] border-r border-black p-1 text-center">UN</th>
                    <th className="w-[8%] border-r border-black text-right p-1">QTD</th>
                    <th className="w-[9%] border-r border-black text-right p-1">V.UNIT</th>
                    <th className="w-[9%] border-r border-black text-right p-1">V.TOTAL</th>
                    <th className="w-[6%] text-right p-1">ICMS%</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((prod, i) => {
                    const tax = prod.tax || {};
                    const vTot = prod.valorTotal || (prod.quantidade * prod.valorUnitario);
                    return (
                      <tr key={prod.id || i} className="border-b border-gray-200 h-6 text-[9px]">
                        <td className="px-1 border-r border-black truncate">{prod.codigo}</td>
                        <td className="px-1 border-r border-black truncate">{prod.descricao.substring(0, 50)}</td>
                        <td className="px-1 border-r border-black text-center">{prod.ncm}</td>
                        <td className="px-1 border-r border-black text-center">{tax.cst || tax.csosn || '00'}</td>
                        <td className="px-1 border-r border-black text-center">{prod.cfop}</td>
                        <td className="px-1 border-r border-black text-center">{prod.unidade}</td>
                        <td className="px-1 border-r border-black text-right">{prod.quantidade}</td>
                        <td className="px-1 border-r border-black text-right">{prod.valorUnitario.toFixed(2)}</td>
                        <td className="px-1 border-r border-black text-right font-bold">{vTot.toFixed(2)}</td>
                        <td className="px-1 text-right">{(tax.aliquotaIcms ?? 0) > 0 ? `${tax.aliquotaIcms}` : ''}</td>
                      </tr>
                    );
                  })}
                  {/* Linhas em branco para preencher a tabela até o fim da página se necessário */}
                </tbody>
              </table>
              
              {/* Se não for a última página, mostra aviso */}
              {!isLastPage && (
                 <div className="mt-auto text-center text-[9px] border-t border-black p-1 italic">
                    CONTINUA NA PRÓXIMA PÁGINA
                 </div>
              )}
            </div>

            {/* Rodapé - Apenas na última página */}
            {isLastPage && (
              <div className="mt-2 no-break">
                {/* Totais */}
                <div className="font-bold text-[10px] bg-gray-200 border border-black border-b-0 p-0.5 px-2 print:bg-gray-300">CÁLCULO DO IMPOSTO</div>
                <div className="border border-black flex text-[9px] mb-2">
                  <div className="w-1/5 border-r border-black p-1">
                    <div className="text-[7px] font-bold text-gray-500">BASE DE CÁLCULO DO ICMS</div>
                    <div className="text-right font-bold">{formatCurrency(invoice.totais.vBC)}</div>
                  </div>
                  <div className="w-1/5 border-r border-black p-1">
                    <div className="text-[7px] font-bold text-gray-500">VALOR DO ICMS</div>
                    <div className="text-right font-bold">{formatCurrency(invoice.totais.vICMS)}</div>
                  </div>
                  <div className="w-1/5 border-r border-black p-1">
                    <div className="text-[7px] font-bold text-gray-500">BASE CÁLC. ICMS S.T.</div>
                    <div className="text-right">0,00</div>
                  </div>
                  <div className="w-1/5 border-r border-black p-1">
                    <div className="text-[7px] font-bold text-gray-500">VALOR DO ICMS S.T.</div>
                    <div className="text-right">0,00</div>
                  </div>
                  <div className="w-1/5 p-1 bg-gray-50">
                    <div className="text-[7px] font-bold text-gray-500">VALOR TOTAL DOS PRODUTOS</div>
                    <div className="text-right font-bold">{formatCurrency(invoice.totais.vProd)}</div>
                  </div>
                </div>
                
                <div className="border border-black border-t-0 flex text-[9px] mb-2 -mt-2">
                  <div className="w-1/5 border-r border-black p-1">
                    <div className="text-[7px] font-bold text-gray-500">VALOR DO FRETE</div>
                    <div className="text-right">{formatCurrency(invoice.totais.vFrete)}</div>
                  </div>
                  <div className="w-1/5 border-r border-black p-1">
                    <div className="text-[7px] font-bold text-gray-500">VALOR DO SEGURO</div>
                    <div className="text-right">{formatCurrency(invoice.totais.vSeg)}</div>
                  </div>
                  <div className="w-1/5 border-r border-black p-1">
                    <div className="text-[7px] font-bold text-gray-500">DESCONTO</div>
                    <div className="text-right">{formatCurrency(invoice.totais.vDesc)}</div>
                  </div>
                  <div className="w-1/5 border-r border-black p-1">
                    <div className="text-[7px] font-bold text-gray-500">OUTRAS DESPESAS</div>
                    <div className="text-right">{formatCurrency(invoice.totais.vOutro)}</div>
                  </div>
                   <div className="w-1/5 p-1 bg-gray-100">
                    <div className="text-[7px] font-bold text-gray-500">VALOR TOTAL DA NOTA</div>
                    <div className="text-right font-bold text-lg">{formatCurrency(invoice.totais.vNF)}</div>
                  </div>
                </div>

                {/* Transportador */}
                <div className="font-bold text-[10px] bg-gray-200 border border-black border-b-0 p-0.5 px-2 print:bg-gray-300">TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
                <div className="border border-black flex text-[9px] mb-2 h-10">
                  <div className="p-1 w-full flex items-center justify-center text-gray-500 italic">
                    Frete por conta: {invoice.globalValues.modalidadeFrete === '9' ? 'Sem Frete' : invoice.globalValues.modalidadeFrete === '0' ? 'Emitente' : 'Destinatário'}
                  </div>
                </div>

                {/* Dados Adicionais */}
                <div className="font-bold text-[10px] bg-gray-200 border border-black border-b-0 p-0.5 px-2 print:bg-gray-300">DADOS ADICIONAIS</div>
                <div className="border border-black min-h-[30mm] p-1">
                  <div className="text-[7px] font-bold text-gray-500">INFORMAÇÕES COMPLEMENTARES</div>
                  <div className="text-[9px] whitespace-pre-wrap leading-tight mt-1 font-mono">
                    {invoice.informacoesComplementares || 'Não há informações complementares.'}
                    {invoice.finalidade === '2' && ` REF. NOTA FISCAL: ${invoice.refNFe}.`}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
