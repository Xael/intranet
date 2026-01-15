import { InvoiceData, Entity, Product, TaxDetails, PaymentMethod, CRT } from '../types';

export const parseNfeXml = async (file: File): Promise<InvoiceData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Helper seguro para pegar texto de tags (busca em qualquer profundidade)
        const getText = (parent: Element | Document | null, tag: string): string => {
          if (!parent) return '';
          // Tenta buscar no elemento pai, se falhar, tenta no documento todo
          const els = parent.getElementsByTagName(tag);
          if (els.length > 0) return els[0].textContent || '';
          return '';
        };

        // Verifica se é um XML de NFe válido
        const infNFeList = xmlDoc.getElementsByTagName('infNFe');
        if (!infNFeList.length) {
          throw new Error("Arquivo XML inválido ou não é uma NF-e.");
        }
        
        // Pega o elemento raiz da nota (infNFe)
        const infNFe = infNFeList[0];
        
        // --- 1. Dados Básicos ---
        const ide = xmlDoc.getElementsByTagName('ide')[0];
        const numero = getText(ide, 'nNF');
        const serie = getText(ide, 'serie');
        const dataEmissaoRaw = getText(ide, 'dhEmi');
        const finalidade = getText(ide, 'finNFe') as '1'|'2'|'3'|'4';
        
        // --- 2. Emitente ---
        const emitTag = xmlDoc.getElementsByTagName('emit')[0];
        const emitEndTag = emitTag.getElementsByTagName('enderEmit')[0];
        
        const emitente: Entity = {
          cnpj: getText(emitTag, 'CNPJ'),
          razaoSocial: getText(emitTag, 'xNome'),
          inscricaoEstadual: getText(emitTag, 'IE'),
          crt: getText(emitTag, 'CRT') as CRT,
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
        let destinatario: Entity = { ...emitente, cnpj: '', razaoSocial: '', inscricaoEstadual: '' }; // Fallback inicial
        
        if (destTag) {
            const destEndTag = destTag.getElementsByTagName('enderDest')[0];
            destinatario = {
                cnpj: getText(destTag, 'CNPJ') || getText(destTag, 'CPF'),
                razaoSocial: getText(destTag, 'xNome'),
                inscricaoEstadual: getText(destTag, 'IE'),
                endereco: destEndTag ? {
                    logradouro: getText(destEndTag, 'xLgr'),
                    numero: getText(destEndTag, 'nro'),
                    bairro: getText(destEndTag, 'xBairro'),
                    municipio: getText(destEndTag, 'xMun'),
                    codigoIbge: getText(destEndTag, 'cMun'),
                    uf: getText(destEndTag, 'UF'),
                    cep: getText(destEndTag, 'CEP')
                } : emitente.endereco, // Fallback se não tiver endereço
                email: getText(destTag, 'email')
            };
        }

        // --- 4. Produtos ---
        const detTags = xmlDoc.getElementsByTagName('det');
        const produtos: Product[] = [];
        
        for (let i = 0; i < detTags.length; i++) {
            const prod = detTags[i].getElementsByTagName('prod')[0];
            const imposto = detTags[i].getElementsByTagName('imposto')[0];
            const icmsTag = imposto?.getElementsByTagName('ICMS')[0];
            
            // Tenta encontrar o grupo de ICMS (ICMS00, ICMS20, ICMSSN101, etc)
            let icmsGroup = null;
            if (icmsTag && icmsTag.children.length > 0) {
                icmsGroup = icmsTag.children[0];
            }

            produtos.push({
                id: crypto.randomUUID(),
                codigo: getText(prod, 'cProd'),
                descricao: getText(prod, 'xProd'),
                ncm: getText(prod, 'NCM'),
                cest: getText(prod, 'CEST'),
                cfop: getText(prod, 'CFOP'),
                unidade: getText(prod, 'uCom'),
                quantidade: parseFloat(getText(prod, 'qCom')),
                valorUnitario: parseFloat(getText(prod, 'vUnCom')),
                valorTotal: parseFloat(getText(prod, 'vProd')),
                taxs: {
                    icms: {
                        origem: getText(icmsGroup, 'orig'),
                        cst: getText(icmsGroup, 'CST') || getText(icmsGroup, 'CSOSN'),
                        aliquota: parseFloat(getText(icmsGroup, 'pICMS')) || 0,
                        baseCalculo: parseFloat(getText(icmsGroup, 'vBC')) || 0,
                    },
                    ipi: {
                        cst: getText(imposto, 'CST'),
                        aliquota: parseFloat(getText(imposto, 'pIPI')) || 0
                    },
                    pis: {
                        cst: getText(imposto, 'CST'),
                        aliquota: parseFloat(getText(imposto, 'pPIS')) || 0
                    },
                    cofins: {
                        cst: getText(imposto, 'CST'),
                        aliquota: parseFloat(getText(imposto, 'pCOFINS')) || 0
                    }
                }
            });
        }

        // --- 5. Totais e Pagamentos ---
        // AQUI ESTAVA O ERRO: Busca ICMSTot onde quer que ele esteja
        const icmsTot = xmlDoc.getElementsByTagName('ICMSTot')[0];
        
        // Pagamento
        const pagTag = xmlDoc.getElementsByTagName('pag')[0];
        const detPag = pagTag ? pagTag.getElementsByTagName('detPag')[0] : null;
        const pagamento: PaymentMethod = {
            tipo: detPag ? getText(detPag, 'tPag') : '90', // 90 = Sem pagamento
            valor: detPag ? parseFloat(getText(detPag, 'vPag')) : 0
        };

        // Info Adicional
        const infAdic = xmlDoc.getElementsByTagName('infAdic')[0];
        const informacoesComplementares = getText(infAdic, 'infCpl');
        
        // --- 6. Identificação de Status e Protocolo ---
        let status: 'editing' | 'authorized' | 'canceled' | 'denied' = 'editing';
        let protocoloAutorizacao = '';
        
        // Procura por protNFe (Protocolo de Autorização)
        const protNFe = xmlDoc.getElementsByTagName('protNFe')[0];
        if (protNFe) {
            const infProt = protNFe.getElementsByTagName('infProt')[0];
            const cStat = getText(infProt, 'cStat');
            // cStat 100 = Autorizado o uso da NF-e
            if (cStat === '100') {
                status = 'authorized';
                protocoloAutorizacao = getText(infProt, 'nProt');
            }
        }

        const chaveAcesso = infNFe.getAttribute('Id')?.replace('NFe', '') || '';

        // Monta o objeto final
        const invoice: InvoiceData = {
          id: crypto.randomUUID(),
          numero,
          serie,
          dataEmissao: dataEmissaoRaw,
          emitente,
          destinatario,
          produtos,
          totais: {
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
          },
          globalValues: {
            frete: icmsTot ? parseFloat(getText(icmsTot, 'vFrete')) : 0,
            seguro: icmsTot ? parseFloat(getText(icmsTot, 'vSeg')) : 0,
            desconto: icmsTot ? parseFloat(getText(icmsTot, 'vDesc')) : 0,
            outrasDespesas: icmsTot ? parseFloat(getText(icmsTot, 'vOutro')) : 0,
            modalidadeFrete: getText(xmlDoc.getElementsByTagName('transp')[0], 'modFrete') || '9'
          },
          pagamento,
          informacoesComplementares,
          status, // Agora define 'authorized' se achar o protocolo
          chaveAcesso,
          protocoloAutorizacao, // Salva o número do protocolo
          xmlAssinado: xmlText, 
          finalidade
        };

        resolve(invoice);

      } catch (err) {
        console.error(err);
        reject(new Error("Erro ao ler o arquivo XML. Verifique se é uma NFe válida."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
