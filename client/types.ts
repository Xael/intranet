// types.ts

// ==========================================
// TIPOS LEGADOS E GERAIS
// ==========================================

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
  manualOut?: boolean;
  outQty?: number;
  remaining?: number; 
  editalId?: string;
}

export interface SaidaItem {
  id: string;
  itemIndex: number; 
  descricao: string;
  marca: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  data: string;
  notaFiscal: string;
  editalId?: string;
}

// New types for "Controle de Empenhos"
export interface ArquivoAnexado {
  nome: string;
  tipo: string;
  dados: string; // base64
}

export interface Empenho {
  id: string;
  dataPedido: string;
  numeroPedido: string;
  numeroProcesso: string;
  empenhoPDF?: ArquivoAnexado;
  notaFiscalPDF?: ArquivoAnexado;
  dataNotaFiscal?: string;
  valorNotaFiscal?: number;
  statusPagamento?: 'PAGO' | 'PENDENTE';
  dataPagamento?: string;
  editalId?: string;
}

export interface Edital {
  id: string;
  nome: string;
  itens: EstoqueItem[];
  saidas: SaidaItem[];
  empenhos?: Empenho[];
  municipioId?: string;
}

export interface Municipio {
  id: string;
  nome: string;
  editais: Edital[];
}

export interface SimulacaoItem {
  id?: number | string;
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
  data: string;
  municipio: string;
  edital: string;
  itens: SimulacaoItem[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  createdAt: string;
  role: 'ADMIN' | 'OPERACIONAL';
  token?: string;
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

// ==========================================
// DETALHAMENTO DE LICITAÇÕES E CALENDÁRIO
// ==========================================

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
  realizationDate: string;
  placement: string;
  status: StatusLicitacaoDetalhada | string;
  companyName: string;
  platformLink: string;
  lastUpdated: string;
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
  start: string;
  title: string;

  // Novos campos do Calendário
  documentationStatus?: 'OK' | 'PENDENTE';
  estimatedValue?: string;
  distance?: string;
  avgEmployees?: string;
  warranty?: string;
  editalFile?: string;
  editalFileName?: string;
}

// ==========================================
// COTAÇÕES
// ==========================================

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
  data: string;
  itens: CotacaoItem[];
}

export interface ValorReferencia {
  id: string;
  produto: string;
  valor: number;
}

export interface SimulacaoCotacaoItem {
   id: string | number;
   produto: string;
   unidade: string;
   quantidade: number;
   valorUnitario: number;
   valorTotal: number;
   marca: string;
   cotacaoOrigem: {
       id: string;
       local: string;
       data: string;
   };
}

export interface SimulacaoCotacaoSalva {
   id: string;
   nome: string;
   data: string;
   itens: SimulacaoCotacaoItem[];
}

// ==========================================
// CALCULADORA
// ==========================================

export interface CustoAdicional {
   id: string;
   descricao: string;
   valor: number;
}

export interface FuncionarioCusto {
   id: string | number;
   nome?: string;
   cargo?: string;
   salarioBase: number;
   custosAdicionais: any[];
}

export interface ItemCusto {
   id?: string;
   nome?: string;
   descricao?: string; 
   valor: number;
}

export interface CalculadoraState {
   funcionarios: FuncionarioCusto[];
   operacional: ItemCusto[];
   veiculos: ItemCusto[];
   impostos: number;
   valorLicitacao: number;
}

export interface CalculadoraSalva {
   id: string;
   nome: string;
   data: string;
   custos: CalculadoraState;
}

// ==========================================
// NFE (NOTA FISCAL ELETRÔNICA)
// ==========================================

export interface Address {
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  codigoIbge: string;
  uf: string;
  cep: string;
}

export type CRT = '1' | '2' | '3';

export interface Entity {
  id?: string;
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual?: string;
  endereco: Address;
  email?: string;
  crt?: CRT;

  certificadoArquivo?: string | null; // na lista vem "Presente" ou null
  certificadoSenha?: string | null;   // na lista vem "***" ou null
}

export interface TaxDetails {
  // ICMS
  origem: string;
  cst?: string;
  csosn?: string;
  baseCalculoIcms?: number;
  aliquotaIcms: number;
  valorIcms?: number;
  
  // PIS
  cstPis: string;
  baseCalculoPis?: number;
  aliquotaPis: number;
  valorPis?: number;

  // COFINS
  cstCofins: string;
  baseCalculoCofins?: number;
  aliquotaCofins: number;
  valorCofins?: number;

  // IPI (CORREÇÃO: Tornado opcional para evitar erro de build no xmlImporter)
  cstIpi?: string; 
  baseCalculoIpi?: number;
  aliquotaIpi?: number;
  valorIpi?: number;
  codigoEnquadramento?: string;

  // Reforma Tributária 2026 (Preparação)
  valorIbs?: number;
  aliquotaIbs?: number;
  valorCbs?: number;
  aliquotaCbs?: number;
}

export interface Product {
  id: string;
  codigo: string;
  gtin?: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  tax: TaxDetails;
  isExternal?: boolean;
}

export interface PaymentMethod {
  tPag: string;
  vPag: number;
  // ✅ ADICIONADO: Suporte a cartão para importação de XML
  card?: {
    cnpj?: string;
    tBand?: string;
    cAut?: string;
  }; 
}

export interface InvoiceTotals {
  vBC: number;
  vICMS: number;
  vProd: number;
  vFrete?: number;
  vSeg?: number;
  vDesc?: number;
  vIPI: number;
  vPIS: number;
  vCOFINS: number;
  vOutro?: number;
  vNF: number;

  // Totais Reforma (Opcional)
  vIBS?: number; 
  vCBS?: number; 
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

export type InvoiceStatus = 'editing' | 'draft' | 'signing' | 'transmitting' | 'authorized' | 'rejected' | 'cancelled' | 'error' | 'processing';

export interface InvoiceEvent {
  // ✅ ADICIONADO: 'autorizacao' para histórico de importação
  tipo: 'cancelamento' | 'cce' | 'autorizacao';
  data: string;
  detalhe: string;
  protocolo: string;
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

  // ✅ ADICIONADO: Campos que o xmlImporter tenta preencher
  protocoloAutorizacao?: string;
  natOp?: string;
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

export type CollectionName = 'issuers' | 'recipients' | 'products' | 'invoices';
