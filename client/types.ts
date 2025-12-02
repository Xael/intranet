
export enum StatusLicitacao {
  EM_ANALISE = "Em Análise",
  AGUARDANDO_DOCUMENTOS = "Aguardando Documentos",
  APROVADA = "Aprovada",
  RECUSADA = "Recusada",
  CONCLUIDA = "Concluída",
}

export interface Licitacao {
  id: string;
  numero: string;
  objeto: string;
  responsavel: string;
  status: StatusLicitacao;
  valorEstimado: number;
  dataAbertura: string;
}

export interface EventoCalendario {
  id: string;
  titulo: string;
  resumo: string;
  data: string;
  licitacaoId: string;
  documentationStatus?: 'OK' | 'PENDENTE';
}

// New types for "Controle de Materiais"
export interface EstoqueItem {
  id: string; 
  descricao: string;
  marca: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface SaidaItem {
  id: string;
  itemIndex: number; 
  descricao: string;
  marca: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  data: string; // "DD/MM/YYYY" format
  notaFiscal: string;
}

// New types for "Controle de Empenhos"
export interface ArquivoAnexado {
  nome: string;
  tipo: string;
  dados: string; // base64 encoded string data part
}

export interface Empenho {
  id: string;
  dataPedido: string; // YYYY-MM-DD
  numeroPedido: string;
  numeroProcesso: string;
  empenhoPDF?: ArquivoAnexado;
  notaFiscalPDF?: ArquivoAnexado;
  dataNotaFiscal?: string; // YYYY-MM-DD
  valorNotaFiscal?: number;
  // Novos campos para controle de pagamento
  statusPagamento?: 'PAGO' | 'PENDENTE';
  dataPagamento?: string; // YYYY-MM-DD
}


export interface Edital {
  id: string;
  nome: string;
  itens: EstoqueItem[];
  saidas: SaidaItem[];
  empenhos?: Empenho[];
}

export interface Municipio {
  id: string;
  nome: string;
  editais: Edital[];
}

export interface SimulacaoItem {
  itemIndex: number;
  descricao: string;
  marca: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface SimulacaoSalva {
  id: string;
  data: string; // ISO string
  municipio: string;
  edital: string;
  itens: SimulacaoItem[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  createdAt: string; // ISO string
  role: 'ADMIN' | 'OPERACIONAL';
}

export interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  outQty: number;
  remaining: number;
  manualOut: boolean;
}

export interface OutputItem {
  id: string;
  date: string;
  product: string;
  qty: number;
  size: string;
  employee: string;
  responsible: string;
}

export interface EPIEntrega {
  id: string;
  funcionario: string;
  item: string;
  quantidade: number;
  dataEntrega: string;
}

export interface EPIEstoqueItem {
  id: string;
  name: string;
  qty: number;
  manualOut: boolean;
  manualOutQty: number;
}

export enum StatusLicitacaoDetalhada {
  EM_ANDAMENTO = 'Em Andamento',
  VENCIDA = 'Vencida',
  ENCERRADA = 'Encerrada',
  DESCLASSIFICADA = 'Desclassificada',
}

export interface LicitacaoDetalhada {
  id: string;
  city: string;
  bidNumber: string;
  realizationDate: string; // YYYY-MM-DD
  placement: string;
  status: StatusLicitacaoDetalhada;
  companyName: string;
  platformLink: string;
  lastUpdated: string; // ISO String
  progressForecast: string;
}

export interface DetalhesEvento {
    city: string;
    bid_number: string;
    time: string;
    location: string;
    description: string;
}

export interface EventoCalendarioDetalhado extends DetalhesEvento {
  id: string;
  start: string; // YYYY-MM-DD date string
  title: string;
}

export interface CotacaoItem {
  id: string;
  produto: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  marca: string;
}

export interface Cotacao {
  id: string;
  local: string;
  data: string; // YYYY-MM-DD
  itens: CotacaoItem[];
}

export interface ValorReferencia {
  id: string; // Normalized product name
  produto: string;
  valor: number;
}

export interface SimulacaoCotacaoItem {
    id: string;
    produto: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    marca: string;
    cotacaoOrigem: {
        id: string; // Cotacao.id
        local: string;
        data: string;
    };
}

export interface SimulacaoCotacaoSalva {
    id: string;
    nome: string;
    data: string; // ISO String
    itens: SimulacaoCotacaoItem[];
}

export interface CustoAdicional {
    id: string;
    descricao: string;
    valor: number;
}

export interface FuncionarioCusto {
    id: string;
    cargo: string;
    salarioBase: number;
    custosAdicionais: CustoAdicional[];
}

export interface ItemCusto {
    id: string;
    descricao: string;
    valor: number;
}

export interface CalculadoraState {
    funcionarios: FuncionarioCusto[];
    operacional: ItemCusto[];
    veiculos: ItemCusto[];
    impostos: number; // Percentage
    valorLicitacao: number;
}
export interface CalculadoraSalva {
    id: string;
    nome: string;
    data: string; // ISO String
    custos: CalculadoraState;
}

// --- NFE MODULE TYPES ---

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
  crt: CRT; 
}

export interface TaxDetails {
  origem: string; 
  cst?: string; 
  csosn?: string; 
  baseCalculoIcms: number;
  aliquotaIcms: number;
  valorIcms: number;
  
  cstPis: string;
  baseCalculoPis: number;
  aliquotaPis: number;
  valorPis: number;

  cstCofins: string;
  baseCalculoCofins: number;
  aliquotaCofins: number;
  valorCofins: number;

  cstIpi?: string; 
  baseCalculoIpi?: number;
  aliquotaIpi?: number;
  valorIpi?: number;
  codigoEnquadramento?: string; 
}

export interface Product {
  id: string;
  codigo: string;
  gtin: string; 
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
  tPag: string; 
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

export type EnvironmentType = '1' | '2'; 

export interface ConfigData {
  ambiente: EnvironmentType;
  certificado?: File | null;
  senhaCertificado?: string;
  proximoNumeroNota: string;
  serie: string;
}

export interface GlobalValues {
    frete: number;
    seguro: number;
    desconto: number;
    outrasDespesas: number;
    modalidadeFrete: '0' | '1' | '9'; 
}

export interface InvoiceData {
  id?: string; 
  numero: string;
  serie: string;
  dataEmissao: string;
  emitente: Entity;
  destinatario: Entity;
  produtos: Product[];
  
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
