
export interface Address {
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  codigoIbge: string;
  uf: string;
  cep: string;
}

export type CRT = '1' | '2' | '3'; // 1 = Simples Nacional, 2 = Simples (Excesso Sublimite), 3 = Regime Normal

export interface Entity {
  id?: string;
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual: string;
  endereco: Address;
  email?: string;
  crt: CRT; // Código de Regime Tributário
}

export interface TaxDetails {
  // ICMS
  origem: string; // 0, 1, 2...
  cst?: string; // Para Regime Normal (00, 20, etc)
  csosn?: string; // Para Simples Nacional (101, 102, etc)
  baseCalculoIcms: number;
  aliquotaIcms: number;
  valorIcms: number;
  
  // PIS
  cstPis: string;
  baseCalculoPis: number;
  aliquotaPis: number;
  valorPis: number;

  // COFINS
  cstCofins: string;
  baseCalculoCofins: number;
  aliquotaCofins: number;
  valorCofins: number;

  // IPI
  cstIpi?: string; // 50, 51, 52, 53, 99...
  baseCalculoIpi?: number;
  aliquotaIpi?: number;
  valorIpi?: number;
  codigoEnquadramento?: string; // Default 999
}

export interface Product {
  id: string;
  codigo: string;
  gtin: string; // EAN/Barcode
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  tax: TaxDetails;
}

export interface PaymentMethod {
  tPag: string; // 01=Dinheiro, 03=Cartão Crédito, 17=PIX, etc
  vPag: number;
}

export interface InvoiceTotals {
  vBC: number;
  vICMS: number;
  vProd: number;
  vFrete: number;
  vSeg: number;
  vDesc: number;
  vIPI: number;
  vPIS: number;
  vCOFINS: number;
  vOutro: number;
  vNF: number;
}

export type EnvironmentType = '1' | '2'; // 1=Production, 2=Homologation

export interface ConfigData {
  ambiente: EnvironmentType;
  certificado?: File | null;
  senhaCertificado?: string;
  proximoNumeroNota: string;
  serie: string;
}

// Global values that affect the invoice but might be input as a total
export interface GlobalValues {
    frete: number;
    seguro: number;
    desconto: number;
    outrasDespesas: number;
    modalidadeFrete: '0' | '1' | '9'; // 0=Emitente, 1=Destinatario, 9=Sem Frete
}

export interface InvoiceData {
  id?: string; 
  numero: string;
  serie: string;
  dataEmissao: string;
  emitente: Entity;
  destinatario: Entity;
  produtos: Product[];
  
  // Totais e Pagamento
  globalValues: GlobalValues;
  totais: InvoiceTotals;
  pagamento: PaymentMethod[];
  informacoesComplementares: string;

  chaveAcesso?: string;
  xmlAssinado?: string;
  status?: InvoiceStatus;
  finalidade: '1' | '2' | '3' | '4'; 
  refNFe?: string;
  historicoEventos?: InvoiceEvent[];
}

export interface InvoiceEvent {
  tipo: 'cancelamento' | 'cce';
  data: string;
  detalhe: string;
  protocolo: string;
}

export enum Step {
  CONFIG = 0,
  EMITENTE = 1,
  DESTINATARIO = 2,
  PRODUTOS = 3,
  PAGAMENTO = 4,
  EMISSAO = 5
}

export interface NcmSuggestion {
  ncm: string;
  descricao: string;
  cfop: string;
}

export type InvoiceStatus = 'editing' | 'draft' | 'signing' | 'transmitting' | 'authorized' | 'rejected' | 'cancelled';

export type CollectionName = 'issuers' | 'recipients' | 'products' | 'invoices';
