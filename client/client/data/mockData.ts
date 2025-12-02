
import { Licitacao, EventoCalendario, StatusLicitacao, EPIEntrega } from '../types';

export const mockLicitacoes: Licitacao[] = [
  {
    id: '1',
    numero: 'PREGÃO 2024/001',
    objeto: 'Aquisição de material de escritório para secretarias municipais.',
    responsavel: 'Ana Silva',
    status: StatusLicitacao.APROVADA,
    valorEstimado: 150000,
    dataAbertura: '2024-08-15',
  },
  {
    id: '2',
    numero: 'CONCORRÊNCIA 2024/005',
    objeto: 'Construção de nova ala no hospital municipal.',
    responsavel: 'Carlos Pereira',
    status: StatusLicitacao.EM_ANALISE,
    valorEstimado: 2500000,
    dataAbertura: '2024-09-01',
  },
  {
    id: '3',
    numero: 'TOMADA DE PREÇOS 2024/012',
    objeto: 'Serviços de manutenção de ar-condicionado dos prédios públicos.',
    responsavel: 'Mariana Costa',
    status: StatusLicitacao.CONCLUIDA,
    valorEstimado: 75000,
    dataAbertura: '2024-07-20',
  },
   {
    id: '4',
    numero: 'PREGÃO 2024/002',
    objeto: 'Compra de computadores para escolas.',
    responsavel: 'João Martins',
    status: StatusLicitacao.RECUSADA,
    valorEstimado: 320000,
    dataAbertura: '2024-07-10',
  },
];

export const mockEventos: EventoCalendario[] = [
  {
    id: 'e1',
    titulo: 'Abertura Pregão 2024/001',
    resumo: 'Entrega de envelopes para aquisição de material de escritório.',
    data: '2024-08-15T10:00:00',
    licitacaoId: '1',
  },
  {
    id: 'e2',
    titulo: 'Visita Técnica Concorrência 2024/005',
    resumo: 'Visita ao local da obra do hospital municipal.',
    data: '2024-08-20T09:00:00',
    licitacaoId: '2',
  },
  {
    id: 'e3',
    titulo: 'Sessão de Lances Pregão 2024/001',
    resumo: 'Sessão pública para lances do pregão de material de escritório.',
    data: '2024-08-25T14:30:00',
    licitacaoId: '1',
  },
  {
    id: 'e4',
    titulo: 'Abertura Concorrência 2024/005',
    resumo: 'Abertura dos envelopes da concorrência para o hospital.',
    data: '2024-09-01T09:00:00',
    licitacaoId: '2',
  },
];

// FIX: Add missing mockEPI export. This is used by ControleEPI component.
export const mockEPI: EPIEntrega[] = [
  {
    id: 'epi1',
    funcionario: 'João da Silva',
    item: 'Capacete de Segurança',
    quantidade: 1,
    dataEntrega: '2024-07-01',
  },
  {
    id: 'epi2',
    funcionario: 'Maria Oliveira',
    item: 'Luvas de Proteção',
    quantidade: 2,
    dataEntrega: '2024-07-01',
  },
  {
    id: 'epi3',
    funcionario: 'Carlos Souza',
    item: 'Óculos de Proteção',
    quantidade: 1,
    dataEntrega: '2024-07-02',
  },
];