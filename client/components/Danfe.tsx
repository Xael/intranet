import React from 'react';
import { InvoiceData, InvoiceTotals } from '../types';

interface DanfeProps {
  invoice: InvoiceData;
}

// ============================================================================
// CONFIGURAÇÃO: 22 ITENS POR PÁGINA (Conforme solicitado)
// ============================================================================
const ITENS_POR_PAGINA = 22; 

// Utilitários
const formatCurrency = (val: any) => {
  const n = typeof val === 'number' ? val : Number(String(val ?? '0').replace(',', '.'));
  return Number.isFinite(n) ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }) : '0,00';
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('pt-BR'); } catch { return dateStr; }
};

const formatChave = (ch44: string) => ch44 ? ch44.replace(/(\d{4})/g, '$1 ').trim() : '';
const onlyDigits = (v?: string) => String(v ?? '').replace(/\D/g, '');

const renderBarcode = () => (
  <div className="h-8 w-full flex items-center justify-center overflow-hidden my-1">
    <div className="tracking-[3px] font-bold text-black scale-y-[2.5] text-[10px] select-none whitespace-nowrap">
        || |||||| |||| || ||||| |||| || |||||||| |||| | ||| || |||
    </div>
  </div>
);

// Componente de Campo Reutilizável
const Campo = ({ label, value, className = "", align = "left", boldVal = true }: { label: string, value: string | number, className?: string, align?: "left"|"right"|"center", boldVal?: boolean }) => (
  <div className={`flex flex-col border-r border-black px-1 h-full justify-center ${className} ${align === 'right' ? 'items-end' : align === 'center' ? 'items-center' : 'items-start'}`}>
    <span className="text-[5px] font-bold text-gray-600 uppercase leading-none mb-0.5 w-full">{label}</span>
    <span className={`text-[8px] leading-none uppercase w-full truncate ${boldVal ? 'font-bold' : ''} ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}>
      {value}
    </span>
  </div>
);

// ============================================================================
// CABEÇALHO (Repete em todas as páginas)
// ============================================================================
const DanfeHeader = ({ invoice, pageIndex, totalPages }: { invoice: InvoiceData, pageIndex: number, totalPages: number }) => {
  const chave44 = onlyDigits(invoice.chaveAcesso || '').padEnd(44, '0').slice(0, 44);
  const natOp = invoice.natOp || 'VENDA DE MERCADORIA';
  const protocolo = invoice.protocoloAutorizacao 
    ? `${invoice.protocoloAutorizacao} - ${formatDate(invoice.historicoEventos?.find(e => e.tipo === 'autorizacao')?.data)}` 
    : '';

  return (
    <>
      {/* CANHOTO (Altura reduzida para economizar espaço) */}
      <div className="border border-black flex h-7 mb-1 text-[7px] break-inside-avoid">
        <div className="w-[20%] border-r border-black p-0.5 flex flex-col justify-center">
           <span className="font-bold">RECEBEMOS DE</span>
           <span className="truncate">{invoice.emitente.razaoSocial.substring(0, 20)}</span>
        </div>
        <div className="w-[60%] border-r border-black p-0.5 flex items-center justify-center text-center font-bold uppercase">
          OS PRODUTOS/SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO
        </div>
        <div className="w-[20%] flex flex-col items-center justify-center font-bold bg-gray-100">
           <span className="text-sm leading-none">NF-e</span>
           <span>Nº {invoice.numero}</span>
           <span>SÉRIE {invoice.serie}</span>
        </div>
      </div>

      {/* DADOS PRINCIPAIS */}
      <div className="border border-black flex mb-1 h-28 break-inside-avoid">
        {/* Emitente */}
        <div className="w-[38%] border-r border-black p-1 flex flex-col justify-center">
          <div className="font-bold text-xs uppercase mb-1 leading-tight">{invoice.emitente.razaoSocial}</div>
          <div className="text-[7px] leading-tight">
            {invoice.emitente.endereco.logradouro}, {invoice.emitente.endereco.numero}<br/>
            {invoice.emitente.endereco.bairro} - {invoice.emitente.endereco.municipio} / {invoice.emitente.endereco.uf}<br/>
            CEP: {invoice.emitente.endereco.cep}<br/>
          </div>
        </div>

        {/* DANFE Box */}
        <div className="w-[12%] border-r border-black flex flex-col items-center p-0.5 justify-center">
          <h1 className="font-bold text-lg leading-none">DANFE</h1>
          <div className="text-[5px] text-center leading-none mb-1">Documento Auxiliar<br/>da Nota Fiscal<br/>Eletrônica</div>
          <div className="flex w-full justify-around text-[6px] mb-0.5"><span>0-Entrada</span><span>1-Saída</span></div>
          <div className="border border-black px-2 py-0 text-md font-bold mb-0.5">1</div>
          <div className="text-[7px] font-bold text-center leading-tight">
            Nº {invoice.numero}<br/>SÉRIE {invoice.serie}<br/>FL {pageIndex + 1}/{totalPages}
          </div>
        </div>

        {/* Chave e Consulta */}
        <div className="w-[50%] p-1 flex flex-col justify-between">
           {renderBarcode()}
           <div className="mb-0.5">
             <div className="text-[6px] font-bold">CHAVE DE ACESSO</div>
             <div className="bg-gray-50 border border-black text-[8px] font-mono text-center px-1 tracking-tighter font-bold">
                {formatChave(chave44)}
             </div>
           </div>
           <div className="text-[7px] text-center leading-tight">
              Consulta de autenticidade no portal nacional da NF-e<br/>www.nfe.fazenda.gov.br/portal
           </div>
        </div>
      </div>

      {/* NATUREZA E PROTOCOLO (Linha única compacta) */}
      <div className="border border-black flex mb-1 h-7 bg-gray-50">
         <div className="w-[55%] border-r border-black"><Campo label="NATUREZA DA OPERAÇÃO" value={natOp} /></div>
         <div className="w-[45%]"><Campo label="PROTOCOLO DE AUTORIZAÇÃO DE USO" value={protocolo} /></div>
      </div>

      {/* INSCRIÇÕES */}
      <div className="border border-black flex mb-1 h-7">
         <div className="w-[33%]"><Campo label="INSCRIÇÃO ESTADUAL" value={invoice.emitente.inscricaoEstadual || ''} /></div>
         <div className="w-[33%]"><Campo label="INSC. ESTADUAL SUBST. TRIB." value="" /></div>
         <div className="w-[34%] border-r-0"><Campo label="CNPJ" value={invoice.emitente.cnpj} /></div>
      </div>

      {/* DESTINATÁRIO */}
      <div className="bg-gray-200 border border-black border-b-0 px-1 py-px font-bold text-[7px] uppercase">Destinatário / Remetente</div>
      <div className="border border-black flex flex-col mb-1">
         <div className="flex border-b border-black h-7">
            <div className="w-[55%]"><Campo label="NOME / RAZÃO SOCIAL" value={invoice.destinatario.razaoSocial} /></div>
            <div className="w-[30%]"><Campo label="CNPJ / CPF" value={invoice.destinatario.cnpj} /></div>
            <div className="w-[15%] border-r-0"><Campo label="DATA DA EMISSÃO" value={formatDate(invoice.dataEmissao)} align="center" /></div>
         </div>
         <div className="flex h-7">
            <div className="w-[45%]"><Campo label="ENDEREÇO" value={`${invoice.destinatario.endereco.logradouro}, ${invoice.destinatario.endereco.numero}`} /></div>
            <div className="w-[25%]"><Campo label="BAIRRO / DISTRITO" value={invoice.destinatario.endereco.bairro} /></div>
            <div className="w-[5%]"><Campo label="UF" value={invoice.destinatario.endereco.uf} align="center" /></div>
            <div className="w-[15%]"><Campo label="INSCRIÇÃO ESTADUAL" value={invoice.destinatario.inscricaoEstadual || 'ISENTO'} /></div>
            <div className="w-[10%] border-r-0"><Campo label="DATA SAÍDA" value={formatDate(invoice.dataEmissao)} align="center" /></div>
         </div>
      </div>
    </>
  );
};

// ============================================================================
// RODAPÉ (TOTAIS + TRANSPORTE + DADOS ADICIONAIS) - Repete em todas
// ============================================================================
const DanfeFooter = ({ invoice, t }: { invoice: InvoiceData, t: InvoiceTotals }) => (
  <div className="mt-auto"> {/* mt-auto empurra para o final do container flex */}
     
     {/* CÁLCULO DO IMPOSTO */}
     <div className="bg-gray-200 border border-black border-b-0 px-1 py-px font-bold text-[7px] uppercase">Cálculo do Imposto</div>
     <div className="border border-black flex mb-1 h-7 bg-gray-50">
        <div className="w-[14%]"><Campo label="BASE CÁLC. ICMS" value={formatCurrency(t.vBC)} align="right" /></div>
        <div className="w-[14%]"><Campo label="VALOR DO ICMS" value={formatCurrency(t.vICMS)} align="right" /></div>
        <div className="w-[14%]"><Campo label="BASE CÁLC. ICMS ST" value="0,00" align="right" /></div>
        <div className="w-[14%]"><Campo label="VALOR DO ICMS ST" value="0,00" align="right" /></div>
        <div className="w-[12%]"><Campo label="V. PIS" value={formatCurrency(t.vPIS)} align="right" /></div>
        <div className="w-[12%]"><Campo label="V. COFINS" value={formatCurrency(t.vCOFINS)} align="right" /></div>
        <div className="w-[20%] border-r-0"><Campo label="TOTAL PRODUTOS" value={formatCurrency(t.vProd)} align="right" /></div>
     </div>
     <div className="border border-black flex mb-1 h-7 -mt-1 border-t-0 bg-gray-50">
        <div className="w-[14%]"><Campo label="VALOR FRETE" value={formatCurrency(t.vFrete)} align="right" /></div>
        <div className="w-[14%]"><Campo label="VALOR SEGURO" value={formatCurrency(t.vSeg)} align="right" /></div>
        <div className="w-[14%]"><Campo label="DESCONTO" value={formatCurrency(t.vDesc)} align="right" /></div>
        <div className="w-[14%]"><Campo label="OUTRAS DESP." value={formatCurrency(t.vOutro)} align="right" /></div>
        <div className="w-[12%]"><Campo label="VALOR IPI" value={formatCurrency(t.vIPI)} align="right" /></div>
        <div className="w-[32%] border-r-0 bg-gray-200"><Campo label="VALOR TOTAL DA NOTA" value={formatCurrency(t.vNF)} align="right" className="text-sm" /></div>
     </div>

     {/* TRANSPORTADORA */}
     <div className="bg-gray-200 border border-black border-b-0 px-1 py-px font-bold text-[7px] uppercase">Transportador / Volumes</div>
     <div className="border border-black flex mb-1 h-7">
        <div className="w-[35%]"><Campo label="RAZÃO SOCIAL" value={invoice.globalValues.modalidadeFrete === '0' ? invoice.emitente.razaoSocial : invoice.globalValues.modalidadeFrete === '1' ? invoice.destinatario.razaoSocial : ''} /></div>
        <div className="w-[15%]"><Campo label="FRETE POR CONTA" value={invoice.globalValues.modalidadeFrete === '9' ? '9-SEM FRETE' : invoice.globalValues.modalidadeFrete === '0' ? '0-EMITENTE' : '1-DESTINAT.'} /></div>
        <div className="w-[10%]"><Campo label="CÓDIGO ANTT" value="" /></div>
        <div className="w-[15%]"><Campo label="PLACA" value="" /></div>
        <div className="w-[5%]"><Campo label="UF" value="" /></div>
        <div className="w-[20%] border-r-0"><Campo label="CNPJ/CPF" value="" /></div>
     </div>

     {/* DADOS ADICIONAIS */}
     <div className="bg-gray-200 border border-black border-b-0 px-1 py-px font-bold text-[7px] uppercase">Dados Adicionais</div>
     <div className="border border-black h-16 p-1 flex flex-col justify-start">
        <span className="text-[5px] font-bold text-gray-600 uppercase mb-0.5">INFORMAÇÕES COMPLEMENTARES</span>
        <span className="text-[7px] font-mono leading-tight whitespace-pre-wrap">
            {invoice.informacoesComplementares || 'Sem informações adicionais.'}
            {invoice.finalidade === '2' && ` REF NF: ${invoice.refNFe}`}
        </span>
     </div>
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export const Danfe: React.FC<DanfeProps> = ({ invoice }) => {
  // Lógica de Paginação (22 itens)
  const items = invoice.produtos || [];
  const chunks = [];
  
  if (items.length === 0) {
    chunks.push([]);
  } else {
    for (let i = 0; i < items.length; i += ITENS_POR_PAGINA) {
      chunks.push(items.slice(i, i + ITENS_POR_PAGINA));
    }
  }

  // Totais
  const defaults: InvoiceTotals = { vBC: 0, vICMS: 0, vProd: 0, vIPI: 0, vPIS: 0, vCOFINS: 0, vNF: 0, vFrete: 0, vSeg: 0, vDesc: 0, vOutro: 0 } as any;
  const t = { ...defaults, ...(invoice.totais || {}) };

  return (
    // Wrapper que controla a visualização na tela vs impressão
    <div id="danfe-root" className="bg-gray-500 p-8 flex flex-col items-center gap-4 min-h-screen">
      
      {/* CSS CRÍTICO PARA IMPRESSÃO CORRETA 
         Isso sobrescreve qualquer estilo do Dashboard
      */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          
          /* Esconde TUDO no navegador */
          body > * { display: none !important; }
          
          /* Mostra APENAS o DANFE */
          #danfe-root { 
            display: block !important; 
            position: absolute !important;
            top: 0; left: 0; 
            width: 210mm;
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important;
          }

          /* Cada página deve ser um bloco separado */
          .danfe-page {
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 5mm !important; /* Margem interna de segurança da impressora */
            position: relative !important;
          }
          
          /* Remove a última quebra de página para não gerar folha em branco */
          .danfe-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

      {chunks.map((chunk, index) => (
        <div key={index} className="danfe-page bg-white w-[210mm] h-[297mm] p-[5mm] text-black border shadow-2xl flex flex-col justify-between box-border">
          
          {/* TOPO DA PÁGINA (Cabeçalho + Produtos) */}
          <div className="flex flex-col flex-1 h-full">
              <DanfeHeader invoice={invoice} pageIndex={index} totalPages={chunks.length} />

              {/* Tabela de Produtos */}
              <div className="bg-gray-200 border border-black border-b-0 px-1 py-px font-bold text-[7px] uppercase mt-1">Dados do Produto / Serviço</div>
              <div className="border border-black flex-1 relative flex flex-col">
                <table className="w-full table-fixed border-collapse">
                  <thead>
                    <tr className="border-b border-black text-[6px] h-3 bg-gray-50">
                      <th className="w-[10%] border-r border-black px-1 text-left">CÓDIGO</th>
                      <th className="w-[35%] border-r border-black px-1 text-left">DESCRIÇÃO</th>
                      <th className="w-[8%] border-r border-black text-center">NCM</th>
                      <th className="w-[5%] border-r border-black text-center">CST</th>
                      <th className="w-[5%] border-r border-black text-center">CFOP</th>
                      <th className="w-[5%] border-r border-black text-center">UN</th>
                      <th className="w-[8%] border-r border-black px-1 text-right">QTD</th>
                      <th className="w-[9%] border-r border-black px-1 text-right">V.UNIT</th>
                      <th className="w-[9%] border-r border-black px-1 text-right">V.TOTAL</th>
                      <th className="w-[6%] px-1 text-right">ICMS%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((prod, i) => {
                      const tax = prod.tax || {};
                      const vTot = prod.valorTotal || (prod.quantidade * prod.valorUnitario);
                      return (
                        <tr key={i} className="border-b border-gray-300 text-[7px] h-4 align-middle">
                          <td className="border-r border-black px-1 truncate">{prod.codigo}</td>
                          <td className="border-r border-black px-1 truncate">{prod.descricao}</td>
                          <td className="border-r border-black text-center">{prod.ncm}</td>
                          <td className="border-r border-black text-center">{tax.cst || tax.csosn || '00'}</td>
                          <td className="border-r border-black text-center">{prod.cfop}</td>
                          <td className="border-r border-black text-center">{prod.unidade}</td>
                          <td className="border-r border-black px-1 text-right">{prod.quantidade}</td>
                          <td className="border-r border-black px-1 text-right">{prod.valorUnitario.toFixed(2)}</td>
                          <td className="border-r border-black px-1 text-right font-bold">{vTot.toFixed(2)}</td>
                          <td className="px-1 text-right">{(tax.aliquotaIcms ?? 0) > 0 ? tax.aliquotaIcms : ''}</td>
                        </tr>
                      )
                    })}
                    {/* Linhas vazias para manter o grid bonito até o final do quadro */}
                    {Array.from({ length: ITENS_POR_PAGINA - chunk.length }).map((_, k) => (
                      <tr key={`empty-${k}`} className="border-r border-l border-gray-100 h-4"><td colSpan={10}></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* RODAPÉ (Dentro do flex container principal) */}
              <DanfeFooter invoice={invoice} t={t} />
          </div>
        </div>
      ))}
    </div>
  );
};
