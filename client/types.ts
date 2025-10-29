
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

// FIX: Add User interface for user management in Configuracoes.tsx.
export interface User {
  id: string;
  name: string;
  username: string;
  createdAt: string; // ISO string
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

// New types for the detailed bidding control
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


// Types for the new detailed Calendar
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

// Types for the new "Cotações" feature
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

// Types for "Calculadora" feature
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
