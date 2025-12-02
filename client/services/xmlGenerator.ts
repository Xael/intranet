import { InvoiceData, EnvironmentType, TaxDetails } from '../types';
import { formatTimezoneDate, getIbgeUfCode } from '../utils/validators';

const pad = (num: string | number, size: number): string => {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
};

const calculateDV = (baseKey: string): number => {
  let sum = 0;
  let weight = 2;
  for (let i = baseKey.length - 1; i >= 0; i--) {
    sum += parseInt(baseKey.charAt(i)) * weight;
    weight++;
    if (weight > 9) weight = 2;
  }
  const remainder = sum % 11;
  const dv = 11 - remainder;
  return dv >= 10 ? 0 : dv;
};

export const generateAccessKey = (data: InvoiceData, env: EnvironmentType): string => {
  const cUF = getIbgeUfCode(data.emitente.endereco.uf);
  const today = new Date();
  const AAMM = `${String(today.getFullYear()).slice(2)}${pad(today.getMonth() + 1, 2)}`;
  const CNPJ = data.emitente.cnpj.replace(/\D/g, '');
  const mod = '55';
  const serie = pad(data.serie, 3);
  const nNF = pad(data.numero, 9);
  const tpEmis = '1';
  const cNF = pad(Math.floor(Math.random() * 99999999), 8); 
  
  const baseKey = `${cUF}${AAMM}${CNPJ}${mod}${serie}${nNF}${tpEmis}${cNF}`;
  const cDV = calculateDV(baseKey);
  
  return `${baseKey}${cDV}`;
};

export const generateCancellationXml = (invoice: InvoiceData, reason: string, env: EnvironmentType): string => {
    const cleanNum = (str: string) => str ? str.replace(/\D/g, '') : '';
    const sanitize = (str: string) => str ? str.replace(/[&<>"']/g, '').trim() : '';
    const cOrgao = getIbgeUfCode(invoice.emitente.endereco.uf);
    const cnpj = cleanNum(invoice.emitente.cnpj);
    const chNFe = invoice.chaveAcesso || '';
    const dhEvento = formatTimezoneDate(new Date());
    const tpEvento = '110111';
    const nSeqEvento = '1';
    const idEvento = `ID${tpEvento}${chNFe}${pad(nSeqEvento, 2)}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <idLote>1</idLote>
  <evento versao="1.00">
    <infEvento Id="${idEvento}">
      <cOrgao>${cOrgao}</cOrgao>
      <tpAmb>${env}</tpAmb>
      <CNPJ>${cnpj}</CNPJ>
      <chNFe>${chNFe}</chNFe>
      <dhEvento>${dhEvento}</dhEvento>
      <tpEvento>${tpEvento}</tpEvento>
      <nSeqEvento>${nSeqEvento}</nSeqEvento>
      <verEvento>1.00</verEvento>
      <detEvento versao="1.00">
        <descEvento>Cancelamento</descEvento>
        <nProt>135230000123456</nProt>
        <xJust>${sanitize(reason)}</xJust>
      </detEvento>
    </infEvento>
  </evento>
</envEvento>`;
};

// Helper to generate Tax XML Block based on CRT/CST/CSOSN
const generateTaxXml = (tax: TaxDetails, crt: string, itemTotal: number) => {
    let icmsBlock = '';
    
    if (crt === '1') {
        const csosn = tax.csosn || '102';
        if (csosn === '101') {
             icmsBlock = `<ICMSSN101><orig>${tax.origem}</orig><CSOSN>101</CSOSN><pCredSN>${tax.aliquotaIcms.toFixed(2)}</pCredSN><vCredICMSSN>${(itemTotal * tax.aliquotaIcms / 100).toFixed(2)}</vCredICMSSN></ICMSSN101>`;
        } else {
             icmsBlock = `<ICMSSN102><orig>${tax.origem}</orig><CSOSN>${csosn}</CSOSN></ICMSSN102>`;
        }
    } else {
        const cst = tax.cst || '00';
        if (cst === '00') {
            icmsBlock = `<ICMS00><orig>${tax.origem}</orig><CST>00</CST><modBC>3</modBC><vBC>${tax.baseCalculoIcms.toFixed(2)}</vBC><pICMS>${tax.aliquotaIcms.toFixed(2)}</pICMS><vICMS>${tax.valorIcms.toFixed(2)}</vICMS></ICMS00>`;
        } else if (cst === '40' || cst === '41') {
            icmsBlock = `<ICMS40><orig>${tax.origem}</orig><CST>${cst}</CST></ICMS40>`;
        } else {
             icmsBlock = `<ICMS90><orig>${tax.origem}</orig><CST>90</CST><modBC>3</modBC><vBC>${tax.baseCalculoIcms.toFixed(2)}</vBC><pICMS>${tax.aliquotaIcms.toFixed(2)}</pICMS><vICMS>${tax.valorIcms.toFixed(2)}</vICMS></ICMS90>`;
        }
    }

    // IPI Block
    let ipiBlock = '';
    if (tax.cstIpi && ['00','49','50','99'].includes(tax.cstIpi)) {
        ipiBlock = `<IPI><cEnq>${tax.codigoEnquadramento || '999'}</cEnq><IPITrib><CST>${tax.cstIpi}</CST><vBC>${(tax.baseCalculoIpi || 0).toFixed(2)}</vBC><pIPI>${(tax.aliquotaIpi || 0).toFixed(2)}</pIPI><vIPI>${(tax.valorIpi || 0).toFixed(2)}</vIPI></IPITrib></IPI>`;
    } else {
        ipiBlock = `<IPI><cEnq>${tax.codigoEnquadramento || '999'}</cEnq><IPINT><CST>${tax.cstIpi || '53'}</CST></IPINT></IPI>`;
    }

    return `
    <imposto>
        <vTotTrib>0.00</vTotTrib>
        <ICMS>${icmsBlock}</ICMS>
        ${ipiBlock}
        <PIS>
            ${['01','02'].includes(tax.cstPis) ? 
                `<PISAliq><CST>${tax.cstPis}</CST><vBC>${tax.baseCalculoPis.toFixed(2)}</vBC><pPIS>${tax.aliquotaPis.toFixed(2)}</pPIS><vPIS>${tax.valorPis.toFixed(2)}</vPIS></PISAliq>` : 
                `<PISNT><CST>${tax.cstPis}</CST></PISNT>`
            }
        </PIS>
        <COFINS>
            ${['01','02'].includes(tax.cstCofins) ? 
                `<COFINSAliq><CST>${tax.cstCofins}</CST><vBC>${tax.baseCalculoCofins.toFixed(2)}</vBC><pCOFINS>${tax.aliquotaCofins.toFixed(2)}</pCOFINS><vCOFINS>${tax.valorCofins.toFixed(2)}</vCOFINS></COFINSAliq>` : 
                `<COFINSNT><CST>${tax.cstCofins}</CST></COFINSNT>`
            }
        </COFINS>
    </imposto>`;
};

export const generateNfeXml = (data: InvoiceData, env: EnvironmentType): string => {
  const sanitize = (str: string) => str ? str.replace(/[&<>"']/g, '').trim() : '';
  const cleanNum = (str: string) => str ? str.replace(/\D/g, '') : '';
  
  const emitCnpj = cleanNum(data.emitente.cnpj);
  const destCnpj = cleanNum(data.destinatario.cnpj);
  const cUF = getIbgeUfCode(data.emitente.endereco.uf);
  const cMunEmit = cleanNum(data.emitente.endereco.codigoIbge);
  const cMunDest = cleanNum(data.destinatario.endereco.codigoIbge);
  
  const accessKey = data.chaveAcesso || generateAccessKey(data, env);
  const cNF = accessKey.substring(35, 43);
  const cDV = accessKey.substring(43, 44);
  const dhEmi = formatTimezoneDate(new Date());

  const prodXml = data.produtos.map((prod, index) => `
        <det nItem="${index + 1}">
            <prod>
                <cProd>${sanitize(prod.codigo)}</cProd>
                <cEAN>${sanitize(prod.gtin) || 'SEM GTIN'}</cEAN>
                <xProd>${sanitize(prod.descricao)}</xProd>
                <NCM>${cleanNum(prod.ncm)}</NCM>
                <CFOP>${cleanNum(prod.cfop)}</CFOP>
                <uCom>${sanitize(prod.unidade)}</uCom>
                <qCom>${prod.quantidade.toFixed(4)}</qCom>
                <vUnCom>${prod.valorUnitario.toFixed(10)}</vUnCom>
                <vProd>${prod.valorTotal.toFixed(2)}</vProd>
                <cEANTrib>${sanitize(prod.gtin) || 'SEM GTIN'}</cEANTrib>
                <uTrib>${sanitize(prod.unidade)}</uTrib>
                <qTrib>${prod.quantidade.toFixed(4)}</qTrib>
                <vUnTrib>${prod.valorUnitario.toFixed(10)}</vUnTrib>
                <indTot>1</indTot>
            </prod>
            ${generateTaxXml(prod.tax, data.emitente.crt, prod.valorTotal)}
        </det>`).join('');

  const pagXml = data.pagamento.map(pag => `
      <detPag>
        <tPag>${pag.tPag}</tPag>
        <vPag>${pag.vPag.toFixed(2)}</vPag>
      </detPag>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe${accessKey}" versao="4.00">
        <ide>
            <cUF>${cUF}</cUF>
            <cNF>${cNF}</cNF>
            <natOp>VENDA DE MERCADORIA</natOp>
            <mod>55</mod>
            <serie>${parseInt(data.serie)}</serie>
            <nNF>${parseInt(data.numero)}</nNF>
            <dhEmi>${dhEmi}</dhEmi>
            <tpNF>1</tpNF>
            <idDest>${data.destinatario.endereco.uf === 'EX' ? '3' : (data.destinatario.endereco.uf === data.emitente.endereco.uf ? '1' : '2')}</idDest>
            <cMunFG>${cMunEmit}</cMunFG>
            <tpImp>1</tpImp>
            <tpEmis>1</tpEmis>
            <cDV>${cDV}</cDV>
            <tpAmb>${env}</tpAmb>
            <finNFe>${data.finalidade}</finNFe>
            <indFinal>1</indFinal>
            <indPres>1</indPres>
            <indIntermed>0</indIntermed>
            <procEmi>0</procEmi>
            <verProc>NFe 1.0</verProc>
        </ide>
        <emit>
            <CNPJ>${emitCnpj}</CNPJ>
            <xNome>${sanitize(data.emitente.razaoSocial)}</xNome>
            <enderEmit>
                <xLgr>${sanitize(data.emitente.endereco.logradouro)}</xLgr>
                <nro>${sanitize(data.emitente.endereco.numero)}</nro>
                <xBairro>${sanitize(data.emitente.endereco.bairro)}</xBairro>
                <cMun>${cMunEmit}</cMun>
                <xMun>${sanitize(data.emitente.endereco.municipio)}</xMun>
                <UF>${sanitize(data.emitente.endereco.uf)}</UF>
                <CEP>${cleanNum(data.emitente.endereco.cep)}</CEP>
                <cPais>1058</cPais>
                <xPais>BRASIL</xPais>
            </enderEmit>
            <IE>${cleanNum(data.emitente.inscricaoEstadual)}</IE>
            <CRT>${data.emitente.crt}</CRT>
        </emit>
        <dest>
            <CNPJ>${destCnpj}</CNPJ>
            <xNome>${sanitize(data.destinatario.razaoSocial)}</xNome>
            <enderDest>
                <xLgr>${sanitize(data.destinatario.endereco.logradouro)}</xLgr>
                <nro>${sanitize(data.destinatario.endereco.numero)}</nro>
                <xBairro>${sanitize(data.destinatario.endereco.bairro)}</xBairro>
                <cMun>${cMunDest}</cMun>
                <xMun>${sanitize(data.destinatario.endereco.municipio)}</xMun>
                <UF>${sanitize(data.destinatario.endereco.uf)}</UF>
                <CEP>${cleanNum(data.destinatario.endereco.cep)}</CEP>
                <cPais>1058</cPais>
                <xPais>BRASIL</xPais>
            </enderDest>
            <indIEDest>1</indIEDest>
            <IE>${cleanNum(data.destinatario.inscricaoEstadual)}</IE>
        </dest>
        ${prodXml}
        <total>
            <ICMSTot>
                <vBC>${data.totais.vBC.toFixed(2)}</vBC>
                <vICMS>${data.totais.vICMS.toFixed(2)}</vICMS>
                <vICMSDeson>0.00</vICMSDeson>
                <vFCP>0.00</vFCP>
                <vBCST>0.00</vBCST>
                <vST>0.00</vST>
                <vFCPST>0.00</vFCPST>
                <vFCPSTRet>0.00</vFCPSTRet>
                <vProd>${data.totais.vProd.toFixed(2)}</vProd>
                <vFrete>${data.totais.vFrete.toFixed(2)}</vFrete>
                <vSeg>${data.totais.vSeg.toFixed(2)}</vSeg>
                <vDesc>${data.totais.vDesc.toFixed(2)}</vDesc>
                <vII>0.00</vII>
                <vIPI>${data.totais.vIPI.toFixed(2)}</vIPI>
                <vIPIDevol>0.00</vIPIDevol>
                <vPIS>${data.totais.vPIS.toFixed(2)}</vPIS>
                <vCOFINS>${data.totais.vCOFINS.toFixed(2)}</vCOFINS>
                <vOutro>${data.totais.vOutro.toFixed(2)}</vOutro>
                <vNF>${data.totais.vNF.toFixed(2)}</vNF>
            </ICMSTot>
        </total>
        <transp>
            <modFrete>${data.globalValues?.modalidadeFrete || '9'}</modFrete>
        </transp>
        <pag>
            ${pagXml}
        </pag>
        <infAdic>
            <infCpl>${sanitize(data.informacoesComplementares)}</infCpl>
        </infAdic>
    </infNFe>
</NFe>`;
};