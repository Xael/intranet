import { InvoiceData, Entity, Product, TaxDetails, PaymentMethod } from '../types';

export const parseNfeXml = async (file: File): Promise<InvoiceData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Helper para pegar texto de forma segura
        const getText = (parent: Element | Document | null, tag: string): string => {
          if (!parent) return '';
          const el = parent.getElementsByTagName(tag)[0];
          return el ? el.textContent || '' : '';
        };

        // Verifica se é uma NFe válida (procura por infNFe em qualquer nível)
        const infNFeList = xmlDoc.getElementsByTagName('infNFe');
        if (!infNFeList.length) {
          throw new Error("Arquivo XML inválido ou não é uma NF-e.");
        }
        
        // Pega o primeiro infNFe encontrado (funciona para nfeProc ou NFe pura)
        const infNFe = infNFeList[0]; 

        // 1. Dados Básicos (Ide)
        // Precisamos buscar 'ide' dentro do contexto do infNFe para evitar pegar de outros lugares se houver
        const ide = infNFe.getElementsByTagName('ide')[0];
        const numero = getText(ide, 'nNF');
        const serie = getText(ide, 'serie');
        const dataEmissaoRaw = getText(ide, 'dhEmi');
        const finalidade = getText(ide, 'finNFe') as '1'|'2'|'3'|'4';
        const natOp = getText(ide, 'natOp');
        
        // 2. Emitente
        const emitTag = infNFe.getElementsByTagName('emit')[0];
        const emitEndTag = emitTag.getElementsByTagName('enderEmit')[0];
        const emitente: Entity = {
          id: crypto.randomUUID(), // ID temporário
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
            // Caso seja consumidor final sem cadastro ou algo atípico
            destinatario = { ...emitente, id: crypto.randomUUID(), razaoSocial: 'CONSUMIDOR', cnpj: '' }; 
        }

        // 4. Produtos
        const produtos: Product[] = [];
        const detList = infNFe.getElementsByTagName('det');
        
        for (let i = 0; i < detList.length; i++) {
          const det = detList[i];
          const prod = det.getElementsByTagName('prod')[0];
          const imposto = det.getElementsByTagName('imposto')[0];

          // Tenta pegar ICMS, PIS, COFINS, IPI
          // A estrutura do ICMS muda (ICMS00, ICMS20, ICMSSN102...), então pegamos o primeiro filho da tag ICMS
          const icmsGroup = imposto?.getElementsByTagName('ICMS')[0];
          const icmsTag = icmsGroup?.children[0]; // Pega o primeiro filho (ex: ICMSSN102)

          const pisGroup = imposto?.getElementsByTagName('PIS')[0];
          const pisTag = pisGroup?.children[0]; 

          const cofinsGroup = imposto?.getElementsByTagName('COFINS')[0];
          const cofinsTag = cofinsGroup?.children[0];
          
          const ipiGroup = imposto?.getElementsByTagName('IPI')[0];
          const ipiTag = ipiGroup?.getElementsByTagName('IPITrib')[0];

          const taxDetails: TaxDetails = {
             origem: getText(icmsTag, 'orig') || '0',
             // ICMS
             cst: getText(icmsTag, 'CST'),
             csosn: getText(icmsTag, 'CSOSN'),
             baseCalculoIcms: parseFloat(getText(icmsTag, 'vBC')) || 0,
             aliquotaIcms: parseFloat(getText(icmsTag, 'pICMS')) || 0,
             valorIcms: parseFloat(getText(icmsTag, 'vICMS')) || 0,
             // PIS
             cstPis: getText(pisTag, 'CST'),
             baseCalculoPis: parseFloat(getText(pisTag, 'vBC')) || 0,
             aliquotaPis: parseFloat(getText(pisTag, 'pPIS')) || 0,
             valorPis: parseFloat(getText(pisTag, 'vPIS')) || 0,
             // COFINS
             cstCofins: getText(cofinsTag, 'CST'),
             baseCalculoCofins: parseFloat(getText(cofinsTag, 'vBC')) || 0,
             aliquotaCofins: parseFloat(getText(cofinsTag, 'pCOFINS')) || 0,
             valorCofins: parseFloat(getText(cofinsTag, 'vCOFINS')) || 0,
             // IPI
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
            gtin: getText(prod, 'cEAN'),
            tax: taxDetails
          });
        }

        // 5. Totais
        // Busca 'total' dentro de infNFe
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
                    card: undefined // XML geralmente não traz detalhes do cartão de forma simples aqui
                });
            }
        }

        // 7. Info Adicional
        const infAdic = infNFe.getElementsByTagName('infAdic')[0];
        const informacoesComplementares = getText(infAdic, 'infCpl');
        
        // Chave e ID
        const chaveAcesso = infNFe.getAttribute('Id')?.replace('NFe', '') || '';

        // Monta objeto final
        const invoice: InvoiceData = {
          id: crypto.randomUUID(),
          numero,
          serie,
          natOp,
          dataEmissao: dataEmissaoRaw, // Mantém o formato ISO original do XML
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
          status: 'editing', // Importa como Editando para o usuário conferir
          chaveAcesso,
          xmlAssinado: xmlText, 
          finalidade
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
