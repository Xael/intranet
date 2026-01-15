import { InvoiceData, Entity, Product, TaxDetails, PaymentMethod, CRT, InvoiceTotals } from '../types';

export const parseNfeXml = async (file: File): Promise<InvoiceData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Helper seguro para pegar texto de tags (busca em qualquer profundidade dentro do pai)
        const getText = (parent: Element | Document | null, tag: string): string => {
          if (!parent) return '';
          const els = parent.getElementsByTagName(tag);
          if (els.length > 0) return els[0].textContent || '';
          return '';
        };

        // Verifica se é um XML de NFe válido
        const infNFeList = xmlDoc.getElementsByTagName('infNFe');
        if (!infNFeList.length) {
          throw new Error("Arquivo XML inválido ou não é uma NF-e.");
        }
        
        const infNFe = infNFeList[0];
        
        // --- 1. Dados Básicos ---
        const ide = xmlDoc.getElementsByTagName('ide')[0];
        const numero = getText(ide, 'nNF');
        const serie = getText(ide, 'serie');
        const dataEmissaoRaw = getText(ide, 'dhEmi');
        // Casting forçado para garantir compatibilidade com o tipo
        const finalidade = (getText(ide, 'finNFe') || '1') as '1'|'2'|'3'|'4';
        
        // --- 2. Emitente ---
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

        // --- 3. Destinatário ---
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

        // --- 4. Produtos ---
        const detTags = xmlDoc.getElementsByTagName('det');
        const produtos: Product[] = [];
        
        for (let i = 0; i < detTags.length; i++) {
            const prod = detTags[i].getElementsByTagName('prod')[0];
            const imposto = detTags[i].getElementsByTagName('imposto')[0];
            
            // --- Extração de Impostos ---
            const icmsParent = imposto?.getElementsByTagName('ICMS')[0];
            const icmsGroup = icmsParent?.children.length ? icmsParent.children[0] : null;

            const pisParent = imposto?.getElementsByTagName('PIS')[0];
            const pisGroup = pisParent?.children.length ? pisParent.children[0] : null;

            const cofinsParent = imposto?.getElementsByTagName('COFINS')[0];
            const cofinsGroup = cofinsParent?.children.length ? cofinsParent.children[0] : null;

            const ipiParent = imposto?.getElementsByTagName('IPI')[0];
            const ipiGroup = ipiParent?.getElementsByTagName('IPITrib')[0] || ipiParent?.getElementsByTagName('IPINT')[0];

            const taxDetails: TaxDetails = {
                // ICMS
                origem: getText(icmsGroup, 'orig') || '0',
                cst: getText(icmsGroup, 'CST'),
                csosn: getText(icmsGroup, 'CSOSN'),
                aliquotaIcms: parseFloat(getText(icmsGroup, 'pICMS')) || 0,
                baseCalculoIcms: parseFloat(getText(icmsGroup, 'vBC')) || 0,
                valorIcms: parseFloat(getText(icmsGroup, 'vICMS')) || 0,

                // PIS
                cstPis: getText(pisGroup, 'CST') || '01',
                aliquotaPis: parseFloat(getText(pisGroup, 'pPIS')) || 0,
                baseCalculoPis: parseFloat(getText(pisGroup, 'vBC')) || 0,
                valorPis: parseFloat(getText(pisGroup, 'vPIS')) || 0,

                // COFINS
                cstCofins: getText(cofinsGroup, 'CST') || '01',
                aliquotaCofins: parseFloat(getText(cofinsGroup, 'pCOFINS')) || 0,
                baseCalculoCofins: parseFloat(getText(cofinsGroup, 'vBC')) || 0,
                valorCofins: parseFloat(getText(cofinsGroup, 'vCOFINS')) || 0,

                // IPI
                cstIpi: getText(ipiGroup, 'CST'),
                aliquotaIpi: parseFloat(getText(ipiGroup, 'pIPI')) || 0,
                baseCalculoIpi: parseFloat(getText(ipiGroup, 'vBC')) || 0,
                valorIpi: parseFloat(getText(ipiGroup, 'vIPI')) || 0,
                codigoEnquadramento: getText(ipiParent, 'cEnq') || '999'
            };

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
                tax: taxDetails
            });
        }

        // --- 5. Totais e Pagamentos ---
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

        // Pagamento
        const pagTags = xmlDoc.getElementsByTagName('detPag');
        const pagamento: PaymentMethod[] = [];
        
        if (pagTags.length > 0) {
            for(let i=0; i<pagTags.length; i++) {
                pagamento.push({
                    tPag: getText(pagTags[i], 'tPag'),
                    vPag: parseFloat(getText(pagTags[i], 'vPag')) || 0
                });
            }
        } else {
             pagamento.push({ tPag: '90', vPag: 0 });
        }

        const infAdic = xmlDoc.getElementsByTagName('infAdic')[0];
        const informacoesComplementares = getText(infAdic, 'infCpl');
        
        // --- 6. Identificação de Status e Protocolo ---
        let status: 'editing' | 'authorized' | 'cancelled' = 'editing';
        let protocoloAutorizacao = '';
        
        const protNFe = xmlDoc.getElementsByTagName('protNFe')[0];
        if (protNFe) {
            const infProt = protNFe.getElementsByTagName('infProt')[0];
            const cStat = getText(infProt, 'cStat');
            if (cStat === '100') {
                status = 'authorized';
                protocoloAutorizacao = getText(infProt, 'nProt');
            } else if (cStat === '101') {
                status = 'cancelled';
            }
        }

        const chaveAcesso = infNFe.getAttribute('Id')?.replace('NFe', '') || '';
        const modFreteRaw = getText(xmlDoc.getElementsByTagName('transp')[0], 'modFrete');
        const modalidadeFrete = (['0','1','9'].includes(modFreteRaw) ? modFreteRaw : '9') as "0"|"1"|"9";

        // Montagem do objeto (Sem tipagem estrita aqui para permitir propriedades extras)
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
          protocoloAutorizacao, // Propriedade que não existe no type, mas existe no runtime
          xmlAssinado: xmlText, 
          finalidade
        };

        // Casting duplo: diz para o TS que isso é um InvoiceData válido, ignorando a propriedade extra
        resolve(invoiceObj as unknown as InvoiceData);

      } catch (err) {
        console.error(err);
        reject(new Error("Erro ao ler o arquivo XML. Verifique se é uma NFe válida."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
