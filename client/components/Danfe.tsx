import React from 'react';
import { InvoiceData, InvoiceTotals } from '../types';

interface DanfeProps {
  invoice: InvoiceData;
}

const onlyDigits = (v?: string) => String(v ?? '').replace(/\D/g, '');

const formatChave = (ch44: string) =>
  ch44 ? ch44.replace(/(\d{4})/g, '$1 ').trim() : '';

const renderBarcode = (chaveAcesso44: string) => {
  return (
    <div className="h-10 w-full flex items-center justify-center bg-white">
      <div className="text-[10px] text-gray-500 font-mono tracking-widest overflow-hidden">
        {chaveAcesso44
          ? formatChave(chaveAcesso44)
          : 'CHAVE DE ACESSO (MOCK)'}
      </div>
    </div>
  );
};

// Configuração de quantos itens cabem por página
const ITENS_PRIMEIRA_PAGINA = 14; // Cabeçalho + Canhoto ocupam espaço
const ITENS_PAGINAS_SEGUINTES = 26; // Páginas seguintes cabem mais

export const Danfe: React.FC<DanfeProps> = ({ invoice }) => {
  // --- SEUS HELPERS ORIGINAIS ---
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
      return String(dateStr);
    }
  };

  // --- SUA LÓGICA DE DADOS PRESERVADA ---
  const chave44 =
    onlyDigits((invoice as any)?.chaveAcesso) ||
    onlyDigits((invoice as any)?.chNFe) ||
    onlyDigits((invoice as any)?.fullData?.chaveAcesso) ||
    '';

  const chave = chave44.slice(0, 44);

  const protocolo =
    (invoice as any).protocoloAutorizacao ||
    (invoice as any).fullData?.protocoloAutorizacao ||
    (invoice as any).historicoEventos?.find((e: any) => e.tipo === 'autorizacao')?.protocolo ||
    '';

  const natOp =
    (invoice as any).natOp ||
    (invoice as any).fullData?.natOp ||
    'VENDA DE MERCADORIA';

  const totaisDefaults: InvoiceTotals = {
    vBC: 0, vICMS: 0, vProd: 0, vIPI: 0, vPIS: 0, vCOFINS: 0, vNF: 0,
    vFrete: 0, vSeg: 0, vDesc: 0, vOutro: 0,
  } as InvoiceTotals;

  const totais: InvoiceTotals = ({ ...totaisDefaults, ...(invoice.totais || {}) } as InvoiceTotals);

  const {
    vBC, vICMS, vPIS, vCOFINS, vProd, vNF, vFrete, vSeg, vDesc, vOutro, vIPI
  } = totais;

  // --- NOVA LÓGICA DE PAGINAÇÃO ---
  const paginateItems = (items: any[]) => {
    if (!items || items.length === 0) return [[]];
    const pages = [];
    pages.push(items.slice(0, ITENS_PRIMEIRA_PAGINA));
    let remaining = items.slice(ITENS_PRIMEIRA_PAGINA);
    while (remaining.length > 0) {
      pages.push(remaining.slice(0, ITENS_PAGINAS_SEGUINTES));
      remaining = remaining.slice(ITENS_PAGINAS_SEGUINTES);
    }
    return pages;
  };

  const productPages = paginateItems(invoice.produtos || []);
  const totalPages = productPages.length;

  return (
    <div className="bg-gray-100 p-8 print:p-0 print:bg-white">
      <div className="max-w-[210mm] mx-auto print:max-w-none">
        
        {productPages.map((pageItems, pageIndex) => {
          const isFirstPage = pageIndex === 0;
          const isLastPage = pageIndex === totalPages - 1;
          const pageNumber = pageIndex + 1;

          return (
            <div 
              key={pageIndex}
              className="bg-white text-black p-[10mm] mb-8 shadow-lg print:shadow-none print:mb-0 print:p-0 print:m-0 relative flex flex-col min-h-[295mm] print:break-after-page"
              style={{ width: '210mm', height: '295mm', boxSizing: 'border-box' }}
            >
              
              {/* === CANHOTO (Apenas 1ª Página) === */}
              {isFirstPage && (
                <div className="border border-black mb-2 flex h-[28mm]">
                  <div className="flex-1 p-1 border-r border-black flex flex-col justify-between">
                    <div className="text-[8px] uppercase">
                      RECEBEMOS DE {invoice.emitente?.razaoSocial?.toUpperCase?.() || ''} OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO
                    </div>
                    <div className="flex items-end mt-2">
                      <div className="border-t border-black w-32 mr-4 text-center text-[8px]">DATA DE RECEBIMENTO</div>
                      <div className="border-t border-black flex-1 text-center text-[8px]">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</div>
                    </div>
                  </div>
                  <div className="w-[35mm] p-1 flex flex-col justify-center items-center">
                    <div className="font-bold text-lg">NF-e</div>
                    <div className="text-xs">Nº {invoice.numero}</div>
                    <div className="text-xs">SÉRIE {invoice.serie}</div>
                  </div>
                </div>
              )}

              {/* Linha pontilhada do canhoto */}
              {isFirstPage && <div className="border-b-2 border-dashed border-black my-1"></div>}

              {/* === CABEÇALHO (Em todas as páginas) === */}
              <div className="border border-black flex mb-1 h-[38mm]">
                <div className="w-5/12 p-1 border-r border-black flex flex-col justify-center">
                  <div className="font-bold text-sm mb-1 uppercase leading-tight">
                    {invoice.emitente?.razaoSocial?.toUpperCase?.() || ''}
                  </div>
                  <div className="text-[9px]">
                    {invoice.emitente?.endereco?.logradouro}, {invoice.emitente?.endereco?.numero} <br/>
                    {invoice.emitente?.endereco?.bairro} - {invoice.emitente?.endereco?.municipio} / {invoice.emitente?.endereco?.uf} <br/>
                    CEP: {invoice.emitente?.endereco?.cep}
                  </div>
                </div>

                <div className="w-2/12 p-1 border-r border-black flex flex-col items-center justify-center text-center">
                  <div className="font-bold text-xl">DANFE</div>
                  <div className="text-[7px] leading-tight">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</div>
                  <div className="flex w-full justify-between px-2 my-1 text-[9px]">
                    <div className="text-left">0 - Entrada<br />1 - Saída</div>
                    <div className="border border-black px-2 py-0 font-bold text-lg">1</div>
                  </div>
                  <div className="font-bold text-xs">Nº {invoice.numero}</div>
                  <div className="font-bold text-xs">SÉRIE {invoice.serie}</div>
                  <div className="text-[8px]">Página {pageNumber}/{totalPages}</div>
                </div>

                <div className="w-5/12 p-1 flex flex-col">
                  {renderBarcode(chave)}
                  <div className="font-bold text-center text-[9px] mt-1">CHAVE DE ACESSO</div>
                  <div className="text-center font-mono text-[10px] bg-gray-100 px-1 border border-gray-200 rounded">
                    {chave ? formatChave(chave) : '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000'}
                  </div>
                  <div className="mt-1 text-center text-[8px] leading-tight">
                    Consulta de autenticidade no portal nacional da NF-e ou no site da Sefaz Autorizadora
                  </div>
                </div>
              </div>

              {/* Natureza e Protocolo */}
              <div className="border border-black flex mb-1 text-[9px]">
                <div className="w-7/12 p-1 border-r border-black">
                  <div className="text-[7px]">NATUREZA DA OPERAÇÃO</div>
                  <div className="font-bold">{String(natOp).toUpperCase()}</div>
                </div>
                <div className="w-5/12 p-1">
                  <div className="text-[7px]">PROTOCOLO DE AUTORIZAÇÃO DE USO</div>
                  <div className="font-bold">
                    {protocolo ? protocolo : '—'} {invoice.dataEmissao ? `- ${formatDate(invoice.dataEmissao)}` : ''}
                  </div>
                </div>
              </div>

              {/* Dados Estaduais */}
              <div className="border border-black flex mb-1 text-[9px]">
                <div className="w-4/12 p-1 border-r border-black">
                  <div className="text-[7px]">INSCRIÇÃO ESTADUAL</div>
                  <div className="font-bold">{invoice.emitente?.inscricaoEstadual}</div>
                </div>
                <div className="w-4/12 p-1 border-r border-black">
                  <div className="text-[7px]">INSC. ESTADUAL DO SUBST. TRIBUTÁRIO</div>
                  <div className="font-bold"></div>
                </div>
                <div className="w-4/12 p-1">
                  <div className="text-[7px]">CNPJ</div>
                  <div className="font-bold">{invoice.emitente?.cnpj}</div>
                </div>
              </div>

              {/* === DESTINATÁRIO (Apenas 1ª Página) === */}
              {isFirstPage ? (
                <>
                  <div className="font-bold text-[9px] bg-gray-200 border border-black border-b-0 p-px pl-1">DESTINATÁRIO / REMETENTE</div>
                  <div className="border border-black flex flex-wrap mb-1 text-[9px]">
                    <div className="w-7/12 p-1 border-r border-b border-black">
                      <div className="text-[7px]">NOME / RAZÃO SOCIAL</div>
                      <div className="font-bold truncate">{invoice.destinatario?.razaoSocial?.toUpperCase?.() || ''}</div>
                    </div>
                    <div className="w-3/12 p-1 border-r border-b border-black">
                      <div className="text-[7px]">CNPJ / CPF</div>
                      <div className="font-bold">{invoice.destinatario?.cnpj}</div>
                    </div>
                    <div className="w-2/12 p-1 border-b border-black">
                      <div className="text-[7px]">DATA DA EMISSÃO</div>
                      <div className="font-bold">{formatDate(invoice.dataEmissao)}</div>
                    </div>

                    <div className="w-6/12 p-1 border-r border-black">
                      <div className="text-[7px]">ENDEREÇO</div>
                      <div className="font-bold truncate">
                        {invoice.destinatario?.endereco?.logradouro}, {invoice.destinatario?.endereco?.numero}
                      </div>
                    </div>
                    <div className="w-3/12 p-1 border-r border-black">
                      <div className="text-[7px]">BAIRRO / DISTRITO</div>
                      <div className="font-bold truncate">{invoice.destinatario?.endereco?.bairro}</div>
                    </div>
                    <div className="w-1/12 p-1 border-r border-black">
                      <div className="text-[7px]">CEP</div>
                      <div className="font-bold">{invoice.destinatario?.endereco?.cep}</div>
                    </div>
                    <div className="w-2/12 p-1">
                      <div className="text-[7px]">DATA DE SAÍDA</div>
                      <div className="font-bold">{formatDate(invoice.dataEmissao)}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gray-100 border border-black p-1 text-center text-xs font-bold mb-1">
                  CONTINUAÇÃO - PÁGINA {pageNumber}
                </div>
              )}

              {/* === PRODUTOS (Preenche o espaço disponível) === */}
              <div className="flex-1 flex flex-col">
                <div className="font-bold text-[9px] bg-gray-200 border border-black border-b-0 p-px pl-1">DADOS DO PRODUTO / SERVIÇO</div>
                <div className="border border-black flex-1 relative">
                  <table className="w-full text-left table-fixed">
                    <thead className="bg-gray-50 border-b border-black">
                      <tr className="text-[8px]">
                        <th className="font-normal p-1 w-[10%] border-r border-black">CÓDIGO</th>
                        <th className="font-normal p-1 w-[35%] border-r border-black">DESCRIÇÃO</th>
                        <th className="font-normal p-1 w-[7%] border-r border-black">NCM</th>
                        <th className="font-normal p-1 w-[5%] border-r border-black">CST</th>
                        <th className="font-normal p-1 w-[5%] border-r border-black">CFOP</th>
                        <th className="font-normal p-1 w-[5%] border-r border-black">UNID</th>
                        <th className="font-normal p-1 w-[7%] border-r border-black text-right">QTD</th>
                        <th className="font-normal p-1 w-[8%] border-r border-black text-right">V.UNIT</th>
                        <th className="font-normal p-1 w-[8%] text-right border-r border-black">V.TOTAL</th>
                        <th className="font-normal p-1 w-[5%] text-right border-r border-black">ICMS</th>
                        <th className="font-normal p-1 w-[5%] text-right">IPI</th>
                      </tr>
                    </thead>
                    <tbody className="text-[9px]">
                      {pageItems.map((prod: any, i: number) => {
                        const tax = prod?.tax || {};
                        const crt = String(invoice.emitente?.crt ?? '');
                        const cstOuCsosn = crt === '1' ? (tax.csosn ?? '-') : (tax.cst ?? '-');

                        const qtd = typeof prod.quantidade === 'number'
                          ? prod.quantidade
                          : Number(String(prod.quantidade ?? '0').replace(',', '.'));

                        const vUnit = typeof prod.valorUnitario === 'number'
                          ? prod.valorUnitario
                          : Number(String(prod.valorUnitario ?? '0').replace(',', '.'));

                        const vTot = typeof prod.valorTotal === 'number'
                          ? prod.valorTotal
                          : Number(String(prod.valorTotal ?? (qtd * vUnit)).replace(',', '.'));

                        return (
                          <tr key={i} className="border-b border-gray-200 last:border-b-0">
                            <td className="p-1 border-r border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">{prod.codigo}</td>
                            <td className="p-1 border-r border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">{prod.descricao}</td>
                            <td className="p-1 border-r border-gray-300">{prod.ncm}</td>
                            <td className="p-1 border-r border-gray-300">{cstOuCsosn}</td>
                            <td className="p-1 border-r border-gray-300">{prod.cfop}</td>
                            <td className="p-1 border-r border-gray-300">{prod.unidade}</td>
                            <td className="p-1 border-r border-gray-300 text-right">{Number.isFinite(qtd) ? qtd : 0}</td>
                            <td className="p-1 border-r border-gray-300 text-right">{Number.isFinite(vUnit) ? vUnit.toFixed(2) : '0.00'}</td>
                            <td className="p-1 border-r border-gray-300 text-right">{Number.isFinite(vTot) ? vTot.toFixed(2) : '0.00'}</td>
                            <td className="p-1 border-r border-gray-300 text-right">{(tax.aliquotaIcms ?? 0) > 0 ? `${tax.aliquotaIcms}%` : '-'}</td>
                            <td className="p-1 text-right">{tax.aliquotaIpi ? `${tax.aliquotaIpi}%` : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* === TOTAIS E DADOS ADICIONAIS (Apenas na última página) === */}
              {isLastPage ? (
                <div className="mt-1">
                  <div className="font-bold text-[9px] bg-gray-200 border border-black border-b-0 p-px pl-1">CÁLCULO DO IMPOSTO</div>
                  <div className="border border-black flex flex-wrap mb-1 text-[9px]">
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                      <div className="text-[7px]">BASE CÁLC. DO ICMS</div>
                      <div className="font-bold text-right">{formatCurrency(vBC)}</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                      <div className="text-[7px]">VALOR DO ICMS</div>
                      <div className="font-bold text-right">{formatCurrency(vICMS)}</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                      <div className="text-[7px]">BASE CÁLC. ST</div>
                      <div className="font-bold text-right">R$ 0,00</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                      <div className="text-[7px]">VALOR ICMS ST</div>
                      <div className="font-bold text-right">R$ 0,00</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                      <div className="text-[7px]">VALOR PIS</div>
                      <div className="font-bold text-right">{formatCurrency(vPIS)}</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                      <div className="text-[7px]">VALOR COFINS</div>
                      <div className="font-bold text-right">{formatCurrency(vCOFINS)}</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-r border-b border-black">
                      <div className="text-[7px]">VALOR TOTAL PROD.</div>
                      <div className="font-bold text-right">{formatCurrency(vProd)}</div>
                    </div>
                    <div className="w-[12.5%] p-1 border-b border-black">
                      <div className="text-[7px]">VALOR TOTAL NOTA</div>
                      <div className="font-bold text-right">{formatCurrency(vNF)}</div>
                    </div>

                    <div className="w-[20%] p-1 border-r border-black">
                      <div className="text-[7px]">VALOR DO FRETE</div>
                      <div className="font-bold text-right">{formatCurrency(vFrete)}</div>
                    </div>
                    <div className="w-[20%] p-1 border-r border-black">
                      <div className="text-[7px]">VALOR DO SEGURO</div>
                      <div className="font-bold text-right">{formatCurrency(vSeg)}</div>
                    </div>
                    <div className="w-[20%] p-1 border-r border-black">
                      <div className="text-[7px]">DESCONTO</div>
                      <div className="font-bold text-right">{formatCurrency(vDesc)}</div>
                    </div>
                    <div className="w-[20%] p-1 border-r border-black">
                      <div className="text-[7px]">OUTRAS DESP.</div>
                      <div className="font-bold text-right">{formatCurrency(vOutro)}</div>
                    </div>
                    <div className="w-[20%] p-1">
                      <div className="text-[7px]">VALOR DO IPI</div>
                      <div className="font-bold text-right">{formatCurrency(vIPI)}</div>
                    </div>
                  </div>

                  {/* Dados Adicionais */}
                  <div className="font-bold text-[9px] bg-gray-200 border border-black border-b-0 p-px pl-1">DADOS ADICIONAIS</div>
                  <div className="border border-black h-[25mm] p-1">
                    <div className="text-[7px] font-bold">INFORMAÇÕES COMPLEMENTARES</div>
                    <div className="text-[9px] whitespace-pre-wrap leading-tight">
                      {(invoice as any).informacoesComplementares || ''}
                      {(invoice as any).finalidade === '2' && ` NOTA FISCAL COMPLEMENTAR REFERENTE À NF ${(invoice as any).refNFe}.`}
                      {(invoice as any).finalidade === '4' && ` NOTA FISCAL DE DEVOLUÇÃO REFERENTE À NF ${(invoice as any).refNFe}.`}
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="h-[20mm] flex items-end justify-center text-xs italic text-gray-500 border-t border-dashed border-gray-300 mt-2">
                    Continua na próxima página...
                 </div>
              )}

              {/* === MARCA D'ÁGUA CANCELADA (Sua lógica original) === */}
              {(invoice as any).status === 'cancelled' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-red-500 text-red-500 font-bold text-6xl opacity-50 rotate-[-45deg] p-4 pointer-events-none z-50">
                  CANCELADA
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Danfe;
