import { InvoiceData, Entity, Product, TaxDetails, PaymentMethod, CRT, InvoiceTotals } from '../types';

export const parseNfeXml = async (file: File): Promise<InvoiceData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let xmlText = e.target?.result as string;

        // === 1. LIMPEZA DE NAMESPACE (A CORREÇÃO DEFINITIVA) ===
        // Remove xmlns="..." para que o parser trate como XML comum.
        // Isso resolve o problema de não encontrar tags como 'infNFe', 'ICMSTot', etc.
        xmlText = xmlText.replace(/ xmlns(:[a-z0-9]+)?="[^"]*"/g, ' ');

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Helper simples (agora funciona 100% pois o XML está limpo)
        const getText = (parent: Element | Document | null, tag: string): string => {
          if (!parent) return '';
          const els = parent.getElementsByTagName(tag);
          if (els.length > 0) return els[0].textContent || '';
          return '';
        };

        // Verifica validade
        const infNFeList = xmlDoc.getElementsByTagName('infNFe');
        if (!infNFeList.length) {
          throw new Error("XML inválido: tag infNFe não encontrada.");
        }
        const infNFe = infNFeList[0];

        // --- DADOS BÁSICOS ---
        const ide = xmlDoc.getElementsByTagName('ide')[0];
        const numero = getText(ide, 'nNF');
        const serie = getText(ide, 'serie');
        const dataEmissaoRaw = getText(ide, 'dhEmi');
        const finalidade = (getText(ide, 'finNFe') || '1') as '1'|'2'|'3'|'4';

        // --- EMITENTE ---
        const emitTag = xmlDoc.getElementsByTagName('emit')[0];
        const emitEndTag = emitTag.getElementsByTagName('enderEmit')[0];
        const emitente: Entity = {
          cnpj: getText(emitTag, 'CNPJ'),
          razaoSocial: getText(emitTag, 'xNome'),
          inscricaoEstadual: getText(emitTag, 'IE'),
          crt: (getText(emitTag, 'CRT') || '1') as CRT,
          endereco: {
            logradouro: getText(emitEndTag, 'xLgr'),
            numero: getText(emitEndTag, 'nro'),
            bairro: getText(emitEndTag, 'xBairro'),
            municipio: getText(emitEndTag, 'xMun'),
            codigoIbge: getText(emitEndTag, 'cMun'),
            uf: getText(emitEndTag, 'UF'),
            cep: getText(emitEndTag, 'CEP')
          }
        };

        // --- DESTINATÁRIO ---
        const destTag = xmlDoc.getElementsByTagName('dest')[0];
        let destinatario: Entity = { ...emitente, cnpj: '', razaoSocial: 'CONSUMIDOR', inscricaoEstadual: '', crt: '1' as CRT };
        
        if (destTag) {
            const destEndTag = destTag.getElementsByTagName('enderDest')[0];
            destinatario = {
                cnpj: getText(destTag, 'CNPJ') || getText(destTag, 'CPF'),
                razaoSocial: getText(destTag, 'xNome'),
                inscricaoEstadual: getText(destTag, 'IE'),
                crt: '1',
                endereco: destEndTag ? {
                    logradouro: getText(destEndTag, 'xLgr'),
                    numero: getText(destEndTag, 'nro'),
                    bairro: getText(destEndTag, 'xBairro'),
                    municipio: getText(destEndTag, 'xMun'),
                    codigoIbge: getText(destEndTag, 'cMun'),
                    uf: getText(destEndTag, 'UF'),
                    cep: getText(destEndTag, 'CEP')
                } : emitente.endereco,
                email: getText(destTag, 'email')
            };
        }

        // --- PRODUTOS ---
        const detTags = xmlDoc.getElementsByTagName('det');
        const produtos: Product[] = [];

        for (let i = 0; i < detTags.length; i++) {
            const prod = detTags[i].getElementsByTagName('prod')[0];
            const imposto = detTags[i].getElementsByTagName('imposto')[0];

            // Busca grupos de imposto (agora sem namespace, é direto)
            const icmsGroup = imposto?.getElementsByTagName('ICMS')[0]?.firstElementChild; 
            const pisGroup = imposto?.getElementsByTagName('PIS')[0]?.firstElementChild;
            const cofinsGroup = imposto?.getElementsByTagName('COFINS')[0]?.firstElementChild;
            
            // IPI pode ser IPITrib ou IPINT
            let ipiGroup = imposto?.getElementsByTagName('IPITrib')[0];
            if (!ipiGroup) ipiGroup = imposto?.getElementsByTagName('IPINT')[0];
            
            produtos.push({
                id: crypto.randomUUID(),
                codigo: getText(prod, 'cProd'),
                descricao: getText(prod, 'xProd'),
                ncm: getText(prod, 'NCM'),
                cfop: getText(prod, 'CFOP'),
                unidade: getText(prod, 'uCom'),
                quantidade: parseFloat(getText(prod, 'qCom')),
                valorUnitario: parseFloat(getText(prod, 'vUnCom')),
                valorTotal: parseFloat(getText(prod, 'vProd')),
                tax: {
                    origem: getText(icmsGroup, 'orig') || '0',
                    cst: getText(icmsGroup, 'CST') || getText(icmsGroup, 'CSOSN'),
                    csosn: getText(icmsGroup, 'CSOSN'),
                    aliquotaIcms: parseFloat(getText(icmsGroup, 'pICMS')) || 0,
                    baseCalculoIcms: parseFloat(getText(icmsGroup, 'vBC')) || 0,
                    valorIcms: parseFloat(getText(icmsGroup, 'vICMS')) || 0,
                    
                    cstPis: getText(pisGroup, 'CST') || '01',
                    aliquotaPis: parseFloat(getText(pisGroup, 'pPIS')) || 0,
                    baseCalculoPis: parseFloat(getText(pisGroup, 'vBC')) || 0,
                    valorPis: parseFloat(getText(pisGroup, 'vPIS')) || 0,

                    cstCofins: getText(cofinsGroup, 'CST') || '01',
                    aliquotaCofins: parseFloat(getText(cofinsGroup, 'pCOFINS')) || 0,
                    baseCalculoCofins: parseFloat(getText(cofinsGroup, 'vBC')) || 0,
                    valorCofins: parseFloat(getText(cofinsGroup, 'vCOFINS')) || 0,

                    cstIpi: getText(ipiGroup, 'CST'),
                    aliquotaIpi: parseFloat(getText(ipiGroup, 'pIPI')) || 0,
                    baseCalculoIpi: parseFloat(getText(ipiGroup, 'vBC')) || 0,
                    valorIpi: parseFloat(getText(ipiGroup, 'vIPI')) || 0,
                    codigoEnquadramento: getText(imposto, 'cEnq') || '999'
                }
            });
        }

        // --- TOTAIS ---
        const icmsTot = xmlDoc.getElementsByTagName('ICMSTot')[0];
        const totais: InvoiceTotals = {
            vBC: icmsTot ? parseFloat(getText(icmsTot, 'vBC')) : 0,
            vICMS: icmsTot ? parseFloat(getText(icmsTot, 'vICMS')) : 0,
            vProd: icmsTot ? parseFloat(getText(icmsTot, 'vProd')) : 0,
            vFrete: icmsTot ? parseFloat(getText(icmsTot, 'vFrete')) : 0,
            vSeg: icmsTot ? parseFloat(getText(icmsTot, 'vSeg')) : 0,
            vDesc: icmsTot ? parseFloat(getText(icmsTot, 'vDesc')) : 0,
            vIPI: icmsTot ? parseFloat(getText(icmsTot, 'vIPI')) : 0,
            vPIS: icmsTot ? parseFloat(getText(icmsTot, 'vPIS')) : 0,
            vCOFINS: icmsTot ? parseFloat(getText(icmsTot, 'vCOFINS')) : 0,
            vOutro: icmsTot ? parseFloat(getText(icmsTot, 'vOutro')) : 0,
            vNF: icmsTot ? parseFloat(getText(icmsTot, 'vNF')) : 0,
        };

        // --- PAGAMENTO ---
        const pagTags = xmlDoc.getElementsByTagName('detPag');
        const pagamento: PaymentMethod[] = [];
        if (pagTags.length > 0) {
            for (let i = 0; i < pagTags.length; i++) {
                pagamento.push({
                    tPag: getText(pagTags[i], 'tPag'),
                    vPag: parseFloat(getText(pagTags[i], 'vPag')) || 0
                });
            }
        } else {
            pagamento.push({ tPag: '90', vPag: 0 });
        }

        // --- INFO ADICIONAL ---
        const infAdic = xmlDoc.getElementsByTagName('infAdic')[0];
        const informacoesComplementares = getText(infAdic, 'infCpl');

        // --- STATUS E PROTOCOLO (CORREÇÃO: Busca global por protNFe) ---
        let status: 'editing' | 'authorized' | 'cancelled' = 'editing';
        let protocoloAutorizacao = '';

        // Como limpamos o namespace, agora getElementsByTagName('protNFe') funciona
        // mesmo se ele estiver fora da tag NFe (o que é padrão no nfeProc)
        const protNFe = xmlDoc.getElementsByTagName('protNFe')[0];
        
        if (protNFe) {
            const infProt = protNFe.getElementsByTagName('infProt')[0];
            const cStat = getText(infProt, 'cStat');
            
            if (cStat === '100') {
                status = 'authorized';
                protocoloAutorizacao = getText(infProt, 'nProt');
            } else if (cStat === '101') {
                status = 'cancelled';
                protocoloAutorizacao = getText(infProt, 'nProt');
            }
        }

        const chaveAcesso = infNFe.getAttribute('Id')?.replace('NFe', '') || '';
        const transp = xmlDoc.getElementsByTagName('transp')[0];
        const modFreteRaw = getText(transp, 'modFrete');
        const modalidadeFrete = (['0','1','9'].includes(modFreteRaw) ? modFreteRaw : '9') as "0"|"1"|"9";

        // Objeto final
        const invoiceObj = {
          id: crypto.randomUUID(),
          numero,
          serie,
          dataEmissao: dataEmissaoRaw,
          emitente,
          destinatario,
          produtos,
          totais,
          globalValues: {
            frete: totais.vFrete || 0,
            seguro: totais.vSeg || 0,
            desconto: totais.vDesc || 0,
            outrasDespesas: totais.vOutro || 0,
            modalidadeFrete: modalidadeFrete
          },
          pagamento,
          informacoesComplementares,
          status,
          chaveAcesso,
          protocoloAutorizacao, // O arquivo Types.ts não tem isso, mas precisamos passar pro Danfe
          xmlAssinado: e.target?.result as string, // Salva o ORIGINAL (com namespace) para assinatura válida
          finalidade
        };

        // Casting "as unknown" para o TypeScript não reclamar do campo extra protocoloAutorizacao
        resolve(invoiceObj as unknown as InvoiceData);

      } catch (err) {
        console.error("Erro ao importar XML:", err);
        reject(new Error("Erro ao ler o arquivo XML. Verifique o console para detalhes."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
