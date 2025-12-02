
import { InvoiceData, Entity, Product, TaxDetails, PaymentMethod, CRT } from '../types';

export const parseNfeXml = async (file: File): Promise<InvoiceData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Helper to safely get element text
        const getText = (parent: Element | Document | null, tag: string): string => {
          if (!parent) return '';
          const el = parent.getElementsByTagName(tag)[0];
          return el ? el.textContent || '' : '';
        };

        // Check if valid NFe
        if (!xmlDoc.getElementsByTagName('infNFe').length) {
          throw new Error("Arquivo XML inválido ou não é uma NF-e.");
        }

        // 1. Basic Info
        const ide = xmlDoc.getElementsByTagName('ide')[0];
        const numero = getText(ide, 'nNF');
        const serie = getText(ide, 'serie');
        const dataEmissaoRaw = getText(ide, 'dhEmi');
        const finalidade = getText(ide, 'finNFe') as '1'|'2'|'3'|'4';
        
        // 2. Issuer (Emitente)
        const emitTag = xmlDoc.getElementsByTagName('emit')[0];
        const emitEndTag = emitTag.getElementsByTagName('enderEmit')[0];
        const emitCrt = getText(emitTag, 'CRT') as CRT;
        
        const emitente: Entity = {
          id: crypto.randomUUID(), 
          cnpj: getText(emitTag, 'CNPJ'),
          razaoSocial: getText(emitTag, 'xNome'),
          inscricaoEstadual: getText(emitTag, 'IE'),
          crt: emitCrt || '1',
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

        // 3. Recipient (Destinatário)
        const destTag = xmlDoc.getElementsByTagName('dest')[0];
        const destEndTag = destTag ? destTag.getElementsByTagName('enderDest')[0] : null;
        
        const destinatario: Entity = {
          id: crypto.randomUUID(),
          cnpj: destTag ? (getText(destTag, 'CNPJ') || getText(destTag, 'CPF')) : '',
          razaoSocial: destTag ? getText(destTag, 'xNome') : '',
          inscricaoEstadual: destTag ? getText(destTag, 'IE') : '',
          crt: '1', // Default as usually not present in XML for dest
          endereco: {
            logradouro: getText(destEndTag, 'xLgr'),
            numero: getText(destEndTag, 'nro'),
            bairro: getText(destEndTag, 'xBairro'),
            municipio: getText(destEndTag, 'xMun'),
            codigoIbge: getText(destEndTag, 'cMun'),
            uf: getText(destEndTag, 'UF'),
            cep: getText(destEndTag, 'CEP')
          }
        };

        // 4. Products
        const detTags = xmlDoc.getElementsByTagName('det');
        const produtos: Product[] = [];

        for (let i = 0; i < detTags.length; i++) {
          const det = detTags[i];
          const prodTag = det.getElementsByTagName('prod')[0];
          const qtd = parseFloat(getText(prodTag, 'qCom'));
          const vUnit = parseFloat(getText(prodTag, 'vUnCom'));
          const vProd = parseFloat(getText(prodTag, 'vProd'));
          
          // Parse Taxes
          const imposto = det.getElementsByTagName('imposto')[0];
          let tax: TaxDetails = {
              origem: '0',
              baseCalculoIcms: 0, aliquotaIcms: 0, valorIcms: 0,
              cstPis: '07', baseCalculoPis: 0, aliquotaPis: 0, valorPis: 0,
              cstCofins: '07', baseCalculoCofins: 0, aliquotaCofins: 0, valorCofins: 0
          };

          if (imposto) {
              // ICMS
              const icmsTag = imposto.getElementsByTagName('ICMS')[0];
              if (icmsTag && icmsTag.children.length > 0) {
                  const icmsInfo = icmsTag.children[0];
                  tax.origem = getText(icmsInfo, 'orig') || '0';
                  tax.cst = getText(icmsInfo, 'CST');
                  tax.csosn = getText(icmsInfo, 'CSOSN');
                  tax.baseCalculoIcms = parseFloat(getText(icmsInfo, 'vBC')) || 0;
                  tax.aliquotaIcms = parseFloat(getText(icmsInfo, 'pICMS')) || 0;
                  tax.valorIcms = parseFloat(getText(icmsInfo, 'vICMS')) || 0;
              }

              // PIS
              const pisTag = imposto.getElementsByTagName('PIS')[0];
              if (pisTag && pisTag.children.length > 0) {
                  const pisInfo = pisTag.children[0];
                  tax.cstPis = getText(pisInfo, 'CST') || '07';
                  tax.baseCalculoPis = parseFloat(getText(pisInfo, 'vBC')) || 0;
                  tax.aliquotaPis = parseFloat(getText(pisInfo, 'pPIS')) || 0;
                  tax.valorPis = parseFloat(getText(pisInfo, 'vPIS')) || 0;
              }

              // COFINS
              const cofinsTag = imposto.getElementsByTagName('COFINS')[0];
              if (cofinsTag && cofinsTag.children.length > 0) {
                  const cofinsInfo = cofinsTag.children[0];
                  tax.cstCofins = getText(cofinsInfo, 'CST') || '07';
                  tax.baseCalculoCofins = parseFloat(getText(cofinsInfo, 'vBC')) || 0;
                  tax.aliquotaCofins = parseFloat(getText(cofinsInfo, 'pCOFINS')) || 0;
                  tax.valorCofins = parseFloat(getText(cofinsInfo, 'vCOFINS')) || 0;
              }
          }

          produtos.push({
            id: crypto.randomUUID(),
            codigo: getText(prodTag, 'cProd'),
            descricao: getText(prodTag, 'xProd'),
            gtin: getText(prodTag, 'cEAN') || 'SEM GTIN',
            ncm: getText(prodTag, 'NCM'),
            cfop: getText(prodTag, 'CFOP'),
            unidade: getText(prodTag, 'uCom'),
            quantidade: qtd,
            valorUnitario: vUnit,
            valorTotal: vProd,
            tax: tax
          });
        }

        // 5. Totals
        const totalTag = xmlDoc.getElementsByTagName('ICMSTot')[0];
        
        // 6. Payments
        const pagTags = xmlDoc.getElementsByTagName('detPag');
        const pagamento: PaymentMethod[] = [];
        for(let i=0; i<pagTags.length; i++) {
             pagamento.push({
                 tPag: getText(pagTags[i], 'tPag'),
                 vPag: parseFloat(getText(pagTags[i], 'vPag')) || 0
             });
        }
        
        // 7. InfAdic
        const infAdic = xmlDoc.getElementsByTagName('infAdic')[0];
        const informacoesComplementares = infAdic ? getText(infAdic, 'infCpl') : '';

        // Extract Access Key
        const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
        const rawId = infNFe.getAttribute('Id') || '';
        const chaveAcesso = rawId.replace('NFe', '');

        // Extract Global Values and Modalidade Frete
        const transpTag = xmlDoc.getElementsByTagName('transp')[0];
        const modFrete = (transpTag ? getText(transpTag, 'modFrete') : '9') as '0' | '1' | '9';

        const vFrete = parseFloat(getText(totalTag, 'vFrete')) || 0;
        const vSeg = parseFloat(getText(totalTag, 'vSeg')) || 0;
        const vDesc = parseFloat(getText(totalTag, 'vDesc')) || 0;
        const vOutro = parseFloat(getText(totalTag, 'vOutro')) || 0;

        // Construct InvoiceData
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
              vFrete: vFrete,
              vSeg: vSeg,
              vDesc: vDesc,
              vIPI: parseFloat(getText(totalTag, 'vIPI')) || 0,
              vPIS: parseFloat(getText(totalTag, 'vPIS')) || 0,
              vCOFINS: parseFloat(getText(totalTag, 'vCOFINS')) || 0,
              vOutro: vOutro,
              vNF: parseFloat(getText(totalTag, 'vNF')) || 0,
          },
          globalValues: {
            frete: vFrete,
            seguro: vSeg,
            desconto: vDesc,
            outrasDespesas: vOutro,
            modalidadeFrete: modFrete
          },
          pagamento,
          informacoesComplementares,
          status: 'authorized', 
          chaveAcesso,
          xmlAssinado: xmlText, 
          finalidade
        };

        resolve(invoice);

      } catch (err) {
        console.error(err);
        reject(new Error("Erro ao processar estrutura do XML. Verifique se é uma NFe válida."));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
    reader.readAsText(file);
  });
};
