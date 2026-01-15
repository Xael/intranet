import { InvoiceData, Entity, Product, TaxDetails, PaymentMethod, CRT, InvoiceTotals } from '../types';

export const parseNfeXml = async (file: File): Promise<InvoiceData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // === HELPER PODEROSO PARA IGNORAR NAMESPACES ===
        // Isso resolve o problema de não encontrar tags por causa do xmlns
        const findTag = (parent: Document | Element | null, tagName: string): Element | null => {
          if (!parent) return null;
          
          // 1. Tenta busca padrão
          const collection = parent.getElementsByTagName(tagName);
          if (collection.length > 0) return collection[0];

          // 2. Tenta busca pelo 'localName' (ignora prefixos como nfe:)
          const allElements = parent.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            if (allElements[i].localName === tagName) {
              return allElements[i];
            }
          }
          return null;
        };

        // Helper para pegar texto usando a busca segura acima
        const getText = (parent: Document | Element | null, tagName: string): string => {
          const el = findTag(parent, tagName);
          return el ? el.textContent || '' : '';
        };

        // Verifica se é um XML de NFe válido
        const infNFe = findTag(xmlDoc, 'infNFe');
        if (!infNFe) {
          throw new Error("Arquivo XML inválido ou não é uma NF-e (infNFe não encontrado).");
        }
        
        // --- 1. Dados Básicos ---
        const ide = findTag(xmlDoc, 'ide');
        const numero = getText(ide, 'nNF');
        const serie = getText(ide, 'serie');
        const dataEmissaoRaw = getText(ide, 'dhEmi');
        const finalidade = (getText(ide, 'finNFe') || '1') as '1'|'2'|'3'|'4';
        
        // --- 2. Emitente ---
        const emitTag = findTag(xmlDoc, 'emit');
        const emitEndTag = findTag(emitTag, 'enderEmit');
        
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
        const destTag = findTag(xmlDoc, 'dest');
        // Cria um destinatário padrão caso a tag não exista
        let destinatario: Entity = { ...emitente, cnpj: '', razaoSocial: 'CONSUMIDOR', inscricaoEstadual: '', crt: '1' as CRT }; 
        
        if (destTag) {
            const destEndTag = findTag(destTag, 'enderDest');
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
        // Aqui usamos getElementsByTagName('*') filtrando por localName 'det' para pegar todos os itens
        const allElements = xmlDoc.getElementsByTagName('*');
        const detTags: Element[] = [];
        for (let i = 0; i < allElements.length; i++) {
            if (allElements[i].localName === 'det') detTags.push(allElements[i]);
        }

        const produtos: Product[] = [];
        
        for (const det of detTags) {
            const prod = findTag(det, 'prod');
            const imposto = findTag(det, 'imposto');
            
            // --- Extração de Impostos ---
            // A função findTag resolve a busca mesmo aninhada
            const icmsGroup = findTag(findTag(imposto, 'ICMS'), '*'); // Pega o primeiro filho do ICMS (ICMS00, ICMS20, etc)
            const pisGroup = findTag(findTag(imposto, 'PIS'), '*');
            const cofinsGroup = findTag(findTag(imposto, 'COFINS'), '*');
            
            // IPI é mais chato pois pode ser IPITrib ou IPINT
            let ipiGroup = findTag(imposto, 'IPITrib');
            if (!ipiGroup) ipiGroup = findTag(imposto, 'IPINT');
            const ipiParent = findTag(imposto, 'IPI');

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
        const icmsTot = findTag(xmlDoc, 'ICMSTot');
        
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
        // Usamos a mesma logica de busca manual para arrays
        const pagTags: Element[] = [];
        const allPags = xmlDoc.getElementsByTagName('*');
        for (let i = 0; i < allPags.length; i++) {
            if (allPags[i].localName === 'detPag') pagTags.push(allPags[i]);
        }

        const pagamento: PaymentMethod[] = [];
        
        if (pagTags.length > 0) {
            for(const p of pagTags) {
                pagamento.push({
                    tPag: getText(p, 'tPag'),
                    vPag: parseFloat(getText(p, 'vPag')) || 0
                });
            }
        } else {
             pagamento.push({ tPag: '90', vPag: 0 });
        }

        const infAdic = findTag(xmlDoc, 'infAdic');
        const informacoesComplementares = getText(infAdic, 'infCpl');
        
        // --- 6. Identificação de Status e Protocolo ---
        // AQUI ESTAVA O PROBLEMA DO STATUS: namespace do nfeProc escondia o protNFe
        let status: 'editing' | 'authorized' | 'cancelled' = 'editing';
        let protocoloAutorizacao = '';
        
        // Busca infProt diretamente, ignorando hierarquia complexa
        const infProt = findTag(xmlDoc, 'infProt');
        
        if (infProt) {
            const cStat = getText(infProt, 'cStat');
            // cStat 100 = Autorizado, 101 = Cancelado (mas aprovado)
            if (cStat === '100') {
                status = 'authorized';
                protocoloAutorizacao = getText(infProt, 'nProt');
            } else if (cStat === '101') {
                status = 'cancelled';
                protocoloAutorizacao = getText(infProt, 'nProt');
            }
        }

        const chaveAcesso = infNFe.getAttribute('Id')?.replace('NFe', '') || '';
        
        const transp = findTag(xmlDoc, 'transp');
        const modFreteRaw = getText(transp, 'modFrete');
        const modalidadeFrete = (['0','1','9'].includes(modFreteRaw) ? modFreteRaw : '9') as "0"|"1"|"9";

        // Objeto final com casting para evitar erro de build se faltar propriedade no Type
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
          protocoloAutorizacao, 
          xmlAssinado: xmlText, 
          finalidade
        };

        resolve(invoiceObj as unknown as InvoiceData);

      } catch (err) {
        console.error(err);
        reject(new Error("Erro ao ler o arquivo XML."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
