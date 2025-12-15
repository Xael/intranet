const fs = require('fs');
const https = require('https');
const axios = require('axios');
const forge = require('node-forge');
const { SignedXml } = require('xml-crypto');
const { create } = require('xmlbuilder2');

class NFeService {
    constructor(pfxPath, senhaCertificado) {
        if (!fs.existsSync(pfxPath)) {
            throw new Error(`Certificado não encontrado em: ${pfxPath}`);
        }

        this.pfxBuffer = fs.readFileSync(pfxPath);
        this.senha = senhaCertificado;

        // Extrair chave privada para assinatura (xml-crypto precisa de PEM)
        const p12Asn1 = forge.asn1.fromDer(this.pfxBuffer.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, this.senha);
        const keyData = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag][0];
        this.privateKeyPem = forge.pki.privateKeyToPem(keyData.key);

        // Agente HTTPS para conexão mútua com a SEFAZ
        this.httpsAgent = new https.Agent({
            pfx: this.pfxBuffer,
            passphrase: this.senha,
            rejectUnauthorized: false // Necessário em homologação muitas vezes
        });
    }

    generateXML(data) {
        // Estrutura Mínima da NFe 4.00
        const nfe = {
            NFe: {
                '@xmlns': 'http://www.portalfiscal.inf.br/nfe',
                infNFe: {
                    '@Id': `NFe${data.chaveAcesso}`,
                    '@versao': '4.00',
                    ide: {
                        cUF: 35, // SP
                        cNF: data.numero,
                        natOp: 'VENDA DE MERCADORIA',
                        mod: 55,
                        serie: data.serie,
                        nNF: data.numero,
                        dhEmi: new Date().toISOString(),
                        tpNF: 1,
                        idDest: 1,
                        cMunFG: data.emitente.endereco.codigoIbge,
                        tpImp: 1,
                        tpEmis: 1,
                        cDV: data.chaveAcesso.slice(-1),
                        tpAmb: 2, // 2 = Homologação
                        finNFe: 1,
                        indFinal: 1,
                        indPres: 1,
                        procEmi: 0,
                        verProc: 'APP_NFE_NODE'
                    },
                    emit: {
                        CNPJ: data.emitente.cnpj.replace(/\D/g, ''),
                        xNome: data.emitente.razaoSocial,
                        enderEmit: {
                            xLgr: data.emitente.endereco.logradouro,
                            nro: data.emitente.endereco.numero,
                            xBairro: data.emitente.endereco.bairro,
                            cMun: data.emitente.endereco.codigoIbge,
                            xMun: data.emitente.endereco.municipio,
                            UF: data.emitente.endereco.uf,
                            CEP: data.emitente.endereco.cep,
                            cPais: 1058,
                            xPais: 'BRASIL'
                        },
                        IE: data.emitente.inscricaoEstadual.replace(/\D/g, ''),
                        CRT: data.emitente.crt
                    },
                    dest: {
                        CNPJ: data.destinatario.cnpj.replace(/\D/g, ''),
                        xNome: data.destinatario.razaoSocial,
                        enderDest: {
                            xLgr: data.destinatario.endereco.logradouro,
                            nro: data.destinatario.endereco.numero,
                            xBairro: data.destinatario.endereco.bairro,
                            cMun: data.destinatario.endereco.codigoIbge,
                            xMun: data.destinatario.endereco.municipio,
                            UF: data.destinatario.endereco.uf,
                            CEP: data.destinatario.endereco.cep,
                            cPais: 1058,
                            xPais: 'BRASIL'
                        },
                        indIEDest: 9
                    },
                    det: data.produtos.map((prod, i) => ({
                        '@nItem': i + 1,
                        prod: {
                            cProd: prod.codigo,
                            cEAN: "SEM GTIN",
                            xProd: prod.descricao,
                            NCM: prod.ncm,
                            CFOP: prod.cfop,
                            uCom: prod.unidade,
                            qCom: prod.quantidade,
                            vUnCom: prod.valorUnitario.toFixed(4),
                            vProd: prod.valorTotal.toFixed(2),
                            cEANTrib: "SEM GTIN",
                            uTrib: prod.unidade,
                            qTrib: prod.quantidade,
                            vUnTrib: prod.valorUnitario.toFixed(4),
                            indTot: 1
                        },
                        imposto: {
                            ICMS: { ICMSSN102: { orig: 0, CSOSN: '102' } },
                            PIS: { PISNT: { CST: '07' } },
                            COFINS: { COFINSNT: { CST: '07' } }
                        }
                    })),
                    total: {
                        ICMSTot: {
                            vBC: '0.00', vICMS: '0.00', vICMSDeson: '0.00',
                            vFCP: '0.00', vBCST: '0.00', vST: '0.00',
                            vFCPST: '0.00', vFCPSTRet: '0.00',
                            vProd: data.totais.vProd.toFixed(2),
                            vFrete: '0.00', vSeg: '0.00', vDesc: '0.00',
                            vII: '0.00', vIPI: '0.00', vIPIDevol: '0.00',
                            vPIS: '0.00', vCOFINS: '0.00', vOutro: '0.00',
                            vNF: data.totais.vNF.toFixed(2)
                        }
                    },
                    transp: { modFrete: 9 }
                }
            }
        };

        return create(nfe).end({ prettyPrint: false });
    }

    signXML(xml) {
        const sig = new SignedXml();
        sig.addReference("//*[local-name(.)='infNFe']",
            ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"],
            "http://www.w3.org/2000/09/xmldsig#sha1");
        
        sig.signingKey = this.privateKeyPem;
        sig.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
        sig.signatureAlgorithm = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
        
        sig.computeSignature(xml);
        return sig.getSignedXml();
    }

    async transmit(xmlAssinado) {
        const envelope = `
            <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
                <soap12:Header>
                    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><cUF>35</cUF><versaoDados>4.00</versaoDados></nfeCabecMsg>
                </soap12:Header>
                <soap12:Body>
                    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">${xmlAssinado}</nfeDadosMsg>
                </soap12:Body>
            </soap12:Envelope>`;

        // URL SP Homologação (Troque se seu estado for outro)
        const url = 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx';

        try {
            const res = await axios.post(url, envelope, {
                headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
                httpsAgent: this.httpsAgent
            });
            return res.data;
        } catch (error) {
            throw new Error(`Erro conexão SEFAZ: ${error.message}`);
        }
    }
}

module.exports = NFeService;
