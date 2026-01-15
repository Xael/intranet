import { InvoiceData, Entity, Product, TaxDetails, PaymentMethod } from '../types';

export const parseNfeXml = async (file: File): Promise<InvoiceData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        const getText = (parent: Element | Document | null, tag: string): string => {
          if (!parent) return '';
          const collection = parent.getElementsByTagName(tag);
          if (collection.length > 0) {
            return collection[0].textContent || '';
          }
          return '';
        };

        const infNFeList = xmlDoc.getElementsByTagName('infNFe');
        if (!infNFeList.length) {
          throw new Error("Arquivo XML inválido: Tag <infNFe> não encontrada.");
        }
        
        const infNFe = infNFeList[0]; 

        // --- VERIFICAÇÃO DE STATUS (NOVO) ---
        // Se tiver a tag protNFe, significa que é uma nota processada/autorizada
        const protNFe = xmlDoc.getElementsByTagName('protNFe');
        let statusNota: any = 'editing'; // Padrão
        let protocoloAutorizacao = '';
        let dataAutorizacao = '';

        if (protNFe.length > 0) {
            const infProt = protNFe[0].getElementsByTagName('infProt')[0];
            const cStat = getText(infProt, 'cStat');
            // 100 = Autorizado
            if (cStat === '100') {
                statusNota = 'authorized';
                protocoloAutorizacao = getText(infProt, 'nProt');
                dataAutorizacao = getText(infProt, 'dhRecbto');
            }
        }
        // -------------------------------------

        // 1. Dados Básicos
        const ide = infNFe.getElementsByTagName('ide')[0];
        if (!ide) throw new Error("Tag <ide> não encontrada no XML.");

        const numero = getText(ide, 'nNF');
        const serie = getText(ide, 'serie');
        const dataEmissaoRaw = getText(ide, 'dhEmi') || new Date().toISOString();
        const finalidade = getText(ide, 'finNFe') as '1'|'2'|'3'|'4';
        
        // 2. Emitente
        const emitTag = infNFe.getElementsByTagName('emit')[0];
        const emitEndTag = emitTag?.getElementsByTagName('enderEmit')[0];
        
        const emitente: Entity = {
          id: crypto.randomUUID(),
          cnpj: getText(emitTag, 'CNPJ'),
          razaoSocial: getText(emitTag, 'xNome'),
          inscricaoEstadual: getText(emitTag, 'IE'),
          crt: getText(emitTag, 'CRT') as '1'|'2'|'3',
          endereco: {
            logradouro: getText(emitEndTag, 'xLgr'),
            numero: getText(emitEndTag, 'nro'),
            bairro: getText(emitEndTag, 'xBairro'),
            municipio: getText(emitEndTag, 'xMun'),
            codigoIbge: getText(emitEndTag, 'cMun'),
            uf: getText(emitEndTag, 'UF'),
            cep: getText(emitEndTag, 'CEP'),
          }
        };

        // 3. Destinatário
        const destTag = infNFe.getElementsByTagName('dest')[0];
        let destinatario: Entity;
        
        if (destTag) {
            const destEndTag = destTag.getElementsByTagName('enderDest')[0];
            destinatario = {
              id: crypto.randomUUID(),
              cnpj: getText(destTag, 'CNPJ') || getText(destTag, 'CPF'),
              razaoSocial: getText(destTag, 'xNome'),
              inscricaoEstadual: getText(destTag, 'IE'),
              endereco: {
                logradouro: getText(destEndTag, 'xLgr'),
                numero: getText(destEndTag, 'nro'),
                bairro: getText(destEndTag, 'xBairro'),
                municipio: getText(destEndTag, 'xMun'),
                codigoIbge: getText(destEndTag, 'cMun'),
                uf: getText(destEndTag, 'UF'),
                cep: getText(destEndTag, 'CEP'),
              }
            };
        } else {
            destinatario = { ...emitente, id: crypto.randomUUID(), razaoSocial: 'CONSUMIDOR', cnpj: '', inscricaoEstadual: '' }; 
        }

        // 4. Produtos
        const produtos: Product[] = [];
        const detList = infNFe.getElementsByTagName('det');
        
        for (let i = 0; i < detList.length; i++) {
          const det = detList[i];
          const prod = det.getElementsByTagName('prod')[0];
          const imposto = det.getElementsByTagName('imposto')[0];

          const icmsGroup = imposto?.getElementsByTagName('ICMS')[0];
          const icmsTag = icmsGroup?.firstElementChild; 

          const pisGroup = imposto?.getElementsByTagName('PIS')[0];
          const pisTag = pisGroup?.firstElementChild; 

          const cofinsGroup = imposto?.getElementsByTagName('COFINS')[0];
          const cofinsTag = cofinsGroup?.firstElementChild;
          
          const ipiGroup = imposto?.getElementsByTagName('IPI')[0];
          const ipiTag = ipiGroup?.getElementsByTagName('IPITrib')[0];

          const taxDetails: TaxDetails = {
             origem: getText(icmsTag, 'orig') || '0',
             cst: getText(icmsTag, 'CST'),
             csosn: getText(icmsTag, 'CSOSN'),
             baseCalculoIcms: parseFloat(getText(icmsTag, 'vBC')) || 0,
             aliquotaIcms: parseFloat(getText(icmsTag, 'pICMS')) || 0,
             valorIcms: parseFloat(getText(icmsTag, 'vICMS')) || 0,
             cstPis: getText(pisTag, 'CST'),
             baseCalculoPis: parseFloat(getText(pisTag, 'vBC')) || 0,
             aliquotaPis: parseFloat(getText(pisTag, 'pPIS')) || 0,
             valorPis: parseFloat(getText(pisTag, 'vPIS')) || 0,
             cstCofins: getText(cofinsTag, 'CST'),
             baseCalculoCofins: parseFloat(getText(cofinsTag, 'vBC')) || 0,
             aliquotaCofins: parseFloat(getText(cofinsTag, 'pCOFINS')) || 0,
             valorCofins: parseFloat(getText(cofinsTag, 'vCOFINS')) || 0,
             cstIpi: getText(ipiTag, 'CST'),
             baseCalculoIpi: parseFloat(getText(ipiTag, 'vBC')) || 0,
             aliquotaIpi: parseFloat(getText(ipiTag, 'pIPI')) || 0,
             valorIpi: parseFloat(getText(ipiTag, 'vIPI')) || 0,
             codigoEnquadramento: getText(ipiGroup, 'cEnq') || '999'
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
            gtin: getText(prod, 'cEAN') || 'SEM GTIN',
            tax: taxDetails
          });
        }

        // 5. Totais
        const totalTag = infNFe.getElementsByTagName('total')[0]?.getElementsByTagName('ICMSTot')[0];
        
        // 6. Pagamento
        const pagTag = infNFe.getElementsByTagName('pag')[0];
        const detPagList = pagTag?.getElementsByTagName('detPag');
        const pagamento: PaymentMethod[] = [];
        if (detPagList) {
            for(let i=0; i< detPagList.length; i++) {
                const p = detPagList[i];
                pagamento.push({
                    tPag: getText(p, 'tPag'),
                    vPag: parseFloat(getText(p, 'vPag')) || 0,
                });
            }
        }

        const infAdic = infNFe.getElementsByTagName('infAdic')[0];
        const informacoesComplementares = getText(infAdic, 'infCpl');
        const chaveAcesso = infNFe.getAttribute('Id')?.replace('NFe', '') || '';

        // Monta o objeto final com o status correto e eventos se houver
        const invoice: InvoiceData = {
          id: crypto.randomUUID(),
          numero,
          serie,
          dataEmissao: dataEmissaoRaw,
          emitente,
          destinatario,
          produtos,
          totais: {
              vBC: parseFloat(getText(totalTag, 'vBC')) || 0,
              vICMS: parseFloat(getText(totalTag, 'vICMS')) || 0,
              vProd: parseFloat(getText(totalTag, 'vProd')) || 0,
              vFrete: parseFloat(getText(totalTag, 'vFrete')) || 0,
              vSeg: parseFloat(getText(totalTag, 'vSeg')) || 0,
              vDesc: parseFloat(getText(totalTag, 'vDesc')) || 0,
              vIPI: parseFloat(getText(totalTag, 'vIPI')) || 0,
              vPIS: parseFloat(getText(totalTag, 'vPIS')) || 0,
              vCOFINS: parseFloat(getText(totalTag, 'vCOFINS')) || 0,
              vOutro: parseFloat(getText(totalTag, 'vOutro')) || 0,
              vNF: parseFloat(getText(totalTag, 'vNF')) || 0,
          },
          globalValues: {
            frete: parseFloat(getText(totalTag, 'vFrete')) || 0,
            seguro: parseFloat(getText(totalTag, 'vSeg')) || 0,
            desconto: parseFloat(getText(totalTag, 'vDesc')) || 0,
            outrasDespesas: parseFloat(getText(totalTag, 'vOutro')) || 0,
            modalidadeFrete: getText(infNFe.getElementsByTagName('transp')[0], 'modFrete') as any || '9'
          },
          pagamento,
          informacoesComplementares,
          status: statusNota, // 'authorized' ou 'editing'
          chaveAcesso,
          xmlAssinado: xmlText, 
          finalidade,
          // Se autorizada, preenche o histórico
          protocoloAutorizacao: protocoloAutorizacao || undefined,
          historicoEventos: statusNota === 'authorized' ? [{
              tipo: 'autorizacao' as any,
              data: dataAutorizacao || new Date().toISOString(),
              detalhe: 'Importado via XML Autorizado',
              protocolo: protocoloAutorizacao
          }] : []
        };

        resolve(invoice);

      } catch (err) {
        console.error(err);
        reject(new Error("Erro ao processar XML: " + (err as Error).message));
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};
