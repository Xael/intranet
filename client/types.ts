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
  // Campos opcionais para compatibilidade com edições manuais
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
  data: string; // "DD/MM/YYYY" format
  notaFiscal: string;
  editalId?: string;
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
  data: string; // ISO string
  municipio: string;
  edital: string;
  itens: SimulacaoItem[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // Opcional no front
  createdAt: string; // ISO string
  role: 'ADMIN' | 'OPERACIONAL';
  token?: string; // Usado no AuthContext
}

// FIX: Add missing types for legacy ControleEstoque component.
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

// FIX: Add missing EPIEntrega interface. This is used by the ControleEPI component.
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
  realizationDate: string; // YYYY-MM-DD
  placement: string;
  status: StatusLicitacaoDetalhada | string;
  companyName: string;
  platformLink: string;
  lastUpdated: string; // ISO String
  progressForecast: string;
}

// Types for the new detailed Calendar
export interface DetalhesEvento {
   city: string;
   bid_number: string;
   time: string;
   location: string;
   description: string;
}

// >>> ATUALIZAÇÃO IMPORTANTE AQUI <<<
// Adicionamos os campos documentationStatus, estimatedValue, etc.
export interface EventoCalendarioDetalhado extends DetalhesEvento {
  id: string;
  start: string; // YYYY-MM-DD date string
  title: string;

  // Novos campos do Calendário (Adicionados hoje)
  documentationStatus?: 'OK' | 'PENDENTE';
  estimatedValue?: string;
  distance?: string;
  avgEmployees?: string;
  warranty?: string;
  editalFile?: string;     // Base64
  editalFileName?: string; // Nome do arquivo
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
  data: string; // YYYY-MM-DD
  itens: CotacaoItem[];
}

export interface ValorReferencia {
  id: string; // Normalized product name
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

// ==========================================
// CALCULADORA
// ==========================================

export interface CustoAdicional {
   id: string;
   descricao: string;
   valor: number;
}

// Ajuste para compatibilidade com Calculadora.tsx (pode esperar id number ou string)
export interface FuncionarioCusto {
   id: string | number;
   nome?: string; // Calculadora usa 'nome' às vezes
   cargo?: string;
   salarioBase: number;
   custosAdicionais: any[]; // Usando any[] para flexibilidade entre CustoAdicional e ItemCusto
}

export interface ItemCusto {
   id?: string;
   nome?: string; // Calculadora usa 'nome'
   descricao?: string; 
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

export type CRT = '1' | '2' | '3'; // 1 = Simples Nacional, 2 = Simples (Excesso Sublimite), 3 = Regime Normal

export interface Entity {
  id?: string;
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual?: string; // Pode ser opcional/vazio
  endereco: Address;
  email?: string;
  crt?: CRT; // Código de Regime Tributário
}

export interface TaxDetails {
  // ICMS
  origem: string; // 0, 1, 2...
  cst?: string; // Para Regime Normal (00, 20, etc)
  csosn?: string; // Para Simples Nacional (101, 102, etc)
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

  // IPI
  cstIpi: string; // Obrigatório ser string
  baseCalculoIpi?: number;
  aliquotaIpi?: number;
  valorIpi?: number;
  codigoEnquadramento?: string; // Default 999
}

export interface Product {
  id: string;
  codigo: string;
  gtin?: string; // Pode ser opcional
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  tax: TaxDetails;
  isExternal?: boolean; // Usado pelo ProductSelector para itens da intranet
}

export interface PaymentMethod {
  tPag: string; // 01=Dinheiro, 03=Cartão Crédito, 17=PIX, etc
  vPag: number;
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

export type InvoiceStatus = 'editing' | 'draft' | 'signing' | 'transmitting' | 'authorized' | 'rejected' | 'cancelled' | 'error';

export interface InvoiceEvent {
  tipo: 'cancelamento' | 'cce';
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

export enum Step {
  CONFIG = 0,
  EMITENTE = 1,
  DESTINATARIO = 2,
  PRODUTOS = 3,
  PAGAMENTO = 4, // Mantendo conforme seu arquivo original
  EMISSAO = 5
}

export interface NcmSuggestion {
  ncm: string;
  descricao: string;
  cfop: string;
}

export type CollectionName = 'issuers' | 'recipients' | 'products' | 'invoices';
