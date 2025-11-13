import React, { useState, FormEvent, useRef, useEffect } from 'react';

// --- INÍCIO DA CORREÇÃO DE ERROS ---
// As importações '../types' e '../utils/api' não existem neste ambiente.
// Criei simulações (mocks) deles abaixo para que o código possa funcionar.

// Mock para '../types'
enum StatusLicitacaoDetalhada {
  EM_ANDAMENTO = "Em Andamento",
  VENCIDA = "Vencida",
  ENCERRADA = "Encerrada",
  DESCLASSIFICADA = "Desclassificada",
}

interface LicitacaoDetalhada {
  id: string;
  bidNumber: string;
  city: string;
  companyName: string;
  platformLink: string;
  realizationDate: string;
  // CORREÇÃO DO ERRO DE BUILD: O tipo real espera 'StatusLicitacaoDetalhada' (o enum).
  status: StatusLicitacaoDetalhada; 
  // CORREÇÃO DO ERRO ANTERIOR: O tipo real espera 'string' (obrigatório).
  placement: string; 
  progressForecast?: string;
  lastUpdated: string;
}

// Mock para '../utils/api'
// Simula um objeto de API para evitar erros
const api = {
  get: async (url: string): Promise<LicitacaoDetalhada[]> => {
    console.log(`MOCK API GET: ${url}`);
    // Simula dados vindo do banco (um com status não-normalizado para teste)
    const mockBids = [
      {
        id: 'mock-1',
        bidNumber: '123/2024',
        city: 'São Paulo (Mock)',
        companyName: 'Tech Solutions',
        platformLink: 'http://example.com',
        realizationDate: new Date().toISOString(),
        status: 'EM_ANDAMENTO', // <-- DADO NÃO NORMALIZADO (string)
        placement: '1º Lugar', 
        progressForecast: 'Aguardando homologação',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'mock-2',
        bidNumber: '456/2024',
        city: 'Rio de Janeiro (Mock)',
        companyName: 'Infra Co.',
        platformLink: 'http://example.com',
        realizationDate: '2025-11-20T10:00:00Z',
        status: StatusLicitacaoDetalhada.ENCERRADA, // Dado normalizado (enum)
        placement: '3º Lugar', 
        progressForecast: 'Finalizado',
        lastUpdated: new Date().toISOString(),
      },
    ];
    // Usamos 'as any' para enganar o TypeScript, já que 'EM_ANDAMENTO' (string)
    // não bateria com o tipo 'status: StatusLicitacaoDetalhada' (enum).
    // Isso simula o seu problema de dados "sujos" vindo da API.
    return Promise.resolve(mockBids as any as LicitacaoDetalhada[]);
  },
  put: async (url: string, data: any): Promise<any> => {
    console.log(`MOCK API PUT: ${url}`, data);
    return Promise.resolve(data); // Retorna o dado atualizado
  },
  post: async (url: string, data: any): Promise<any> => {
    console.log(`MOCK API POST: ${url}`, data);
    // Retorna o novo dado com um ID mock
    return Promise.resolve({ ...data, id: `mock-${Math.random().toString(36).substring(7)}` });
  },
  delete: async (url: string): Promise<void> => {
    console.log(`MOCK API DELETE: ${url}`);
    return Promise.resolve();
  },
};
// --- FIM DA CORREÇÃO DE ERROS ---


// 1) Helper de estilos por status
const getStatusStyles = (status: StatusLicitacaoDetalhada | string) => {
  switch (status) {
    // amarelo pastel
    case StatusLicitacaoDetalhada.EM_ANDAMENTO:
      return {
        border: 'border-yellow-400',
        pill: 'bg-yellow-400 text-white',
        background: 'bg-yellow-50', // Tom pastel amarelo
      };
    // verde pastel
    case StatusLicitacaoDetalhada.VENCIDA:
      return {
        border: 'border-green-500',
        pill: 'bg-green-500 text-white',
        background: 'bg-green-50', // Tom pastel verde
      };
    // azul pastel
    case StatusLicitacaoDetalhada.ENCERRADA:
      return {
        border: 'border-blue-400', // Mudei para azul
        pill: 'bg-blue-400 text-white', // Mudei para azul
        background: 'bg-blue-50', // Tom pastel azul
      };
    // cinza claro (sem cor)
    case StatusLicitacaoDetalhada.DESCLASSIFICADA:
      return {
        border: 'border-gray-300', // Borda mais visível
        pill: 'bg-gray-300 text-gray-700',
        background: 'bg-gray-100', // Tom pastel acinzentado
      };
    default:
      // Isso agora vai pegar 'EM_ANDAMENTO' ou qualquer outro status não normalizado
      console.warn(`Status desconhecido recebido: '${status}', usando estilo padrão.`);
      return {
        border: 'border-slate-200',
        pill: 'bg-slate-200 text-slate-700',
        background: 'bg-slate-50', // Padrão pastel
      };
  }
};

const getDateHighlightClass = (bid: LicitacaoDetalhada): string => {
  if (bid.status !== StatusLicitacaoDetalhada.EM_ANDAMENTO || !bid.realizationDate) {
    return '';
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const realizationDate = new Date(bid.realizationDate);
  realizationDate.setMinutes(realizationDate.getMinutes() + realizationDate.getTimezoneOffset());
  realizationDate.setHours(0, 0, 0, 0);

  const diffTime = realizationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'shadow-lg shadow-red-500/50 animate-pulse';
  if (diffDays > 0 && diffDays <= 7) return 'shadow-lg shadow-yellow-500/50';
  return '';
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateString;
  }
};

const formatDateTime = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('pt-BR');
};

// Esta é a função-chave para corrigir o problema das cores
const normalizeStatus = (status: string): StatusLicitacaoDetalhada => {
  // Adiciona uma verificação extra para caso o status já venha nulo ou indefinido
  if (!status) return StatusLicitacaoDetalhada.ENCERRADA;

  const value = status.trim();
  // Verifica se o valor já é um valor válido do enum
  for (const key in StatusLicitacaoDetalhada) {
    if (StatusLicitacaoDetalhada[key as keyof typeof StatusLicitacaoDetalhada] === value) {
      return value as StatusLicitacaoDetalhada;
    }
  }

  // Tenta normalizar baseado no texto (ex: 'EM_ANDAMENTO' ou 'encerrada')
  const lowerStatus = value.toLowerCase();
  if (lowerStatus.includes('andamento')) return StatusLicitacaoDetalhada.EM_ANDAMENTO;
  if (lowerStatus.includes('vencida')) return StatusLicitacaoDetalhada.VENCIDA;
  if (lowerStatus.includes('encerrada')) return StatusLicitacaoDetalhada.ENCERRADA;
  if (lowerStatus.includes('desclassificada')) return StatusLicitacaoDetalhada.DESCLASSIFICADA;
  
  // Retorna um padrão se não conseguir identificar
  return StatusLicitacaoDetalhada.ENCERRADA;
};

interface StatusLicitacoesProps {
  bids: LicitacaoDetalhada[];
  setBids: React.Dispatch<React.SetStateAction<LicitacaoDetalhada[]>>;
}

const StatusLicitacoes: React.FC<StatusLicitacoesProps> = ({ bids, setBids }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBid, setEditingBid] = useState<LicitacaoDetalhada | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Criamos um estado interno para guardar os dados normalizados
  const [normalizedBids, setNormalizedBids] = useState<LicitacaoDetalhada[]>([]);

  // Este é o "coração" da correção.
  // Este efeito vai rodar sempre que a prop 'bids' (vinda do componente pai) mudar.
  useEffect(() => {
    // Verificamos se 'bids' realmente existe
    if (bids) {
      // 1. Criamos um novo array onde cada 'bid' passou pela função 'normalizeStatus'
      const normalized = bids.map(bid => ({
        ...bid,
        // Usamos 'as string' pois sabemos que 'bid.status' PODE SER uma string
        // em runtime, apesar do tipo 'StatusLicitacaoDetalhada'.
        status: normalizeStatus(bid.status as string) 
      }));
      
      // 2. Atualizamos o nosso estado interno com os dados normalizados
      setNormalizedBids(normalized);
    } 
  }, [bids]); // O 'bids' na dependência garante que isso rode quando os dados carregarem

  // Se o componente fosse responsável por carregar os dados, faríamos assim:
  useEffect(() => {
    // Este efeito só vai rodar se 'bids' não for fornecido (ex: undefined)
    // Isso é só para o nosso mock funcionar. No seu app real, o useEffect
    // anterior (que depende de 'bids') é o que vai funcionar.
    if (!bids) { 
      const fetchBids = async () => {
        try {
          const data = await api.get('/api/licitacoes'); // Chama nosso mock
          const normalized = data.map(bid => ({
            ...bid,
            status: normalizeStatus(bid.status as string)
          }));
          setNormalizedBids(normalized); // Atualiza o estado interno
          // No seu app real, o setBids viria do componente pai
          // setBids(normalized); 
        } catch (error) {
           console.error('Erro ao buscar licitações (mock):', error);
        }
      };
      fetchBids();
    }
  }, [bids]); // Roda se 'bids' mudar (ou for indefinido)


  const showModal = (bid: LicitacaoDetalhada | null) => {
    setEditingBid(bid);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBid(null);
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Remove 'id' e 'lastUpdated' dos dados do formulário
    const { id, lastUpdated, ...bidData } = Object.fromEntries(formData.entries()) as any as LicitacaoDetalhada;

    const now = new Date().toISOString();

    try {
      if (editingBid) {
        // Garante que 'placement' seja uma string, mesmo que vazia, para bater com o tipo
        const updatedBid = { 
          ...editingBid, 
          ...bidData, 
          lastUpdated: now, 
          status: normalizeStatus(bidData.status as string),
          placement: bidData.placement || "" // Garante que placement seja string
        };
        const savedBid = await api.put(`/api/licitacoes/${editingBid.id}`, updatedBid);
        
        // Atualiza o estado PAI (que aciona o useEffect e normaliza de novo)
        setBids(currentBids => currentBids.map(b => (b.id === editingBid.id ? savedBid : b)));
      } else {
        const newBid: Omit<LicitacaoDetalhada, 'id'> = {
          ...(bidData as Omit<LicitacaoDetalhada, 'id' | 'lastUpdated'>), // Cast para o tipo base
          lastUpdated: now,
          status: normalizeStatus(bidData.status as string),
          placement: bidData.placement || "" // Garante que placement seja string
        };
        const savedBid = await api.post('/api/licitacoes', newBid);
        // Atualiza o estado PAI
        setBids(currentBids => [...currentBids, savedBid]);
      }
      closeModal();
    } catch (error) {
      console.error(`Falha ao salvar licitação: ${(error as Error).message}`);
    }
  };

  const handleDelete = async (bidId: string) => {
    // Substituindo window.confirm por um log no console
    console.log(`Tentativa de excluir licitação: ${bidId}. Simule a confirmação.`);
    // if (!window.confirm('Tem certeza que deseja excluir esta licitação?')) return;
    
    try {
      await api.delete(`/api/licitacoes/${bidId}`);
      // Atualiza o estado PAI
      setBids(currentBids => currentBids.filter(b => b.id !== bidId));
    } catch (error) {
      console.error(`Falha ao excluir licitação: ${(error as Error).message}`);
    }
  };

  const handleBackup = () => {
    // Usamos 'normalizedBids' para garantir que o backup tenha os dados corretos
    if (normalizedBids.length === 0) {
      console.warn('Não há dados para fazer backup.');
      return;
    }
    
    const dataStr = JSON.stringify({ bids: normalizedBids }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `backup_licitacoes_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    restoreInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      console.error('Por favor, selecione um arquivo de backup .json válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("Arquivo vazio ou ilegível.");

        const data = JSON.parse(text);
        const licitacoesToRestore = data.bids && Array.isArray(data.bids) ? data.bids : Array.isArray(data) ? data : null;

        if (!licitacoesToRestore) {
          throw new Error('Formato do arquivo de backup inválido. Esperado um array de licitações ou um objeto com a chave "bids".');
        }

        // A função de restore já normalizava, o que é ótimo!
        const normalizedBidsFromFile = licitacoesToRestore.map((bid: any) => ({
          ...bid,
          status: normalizeStatus(bid.status),
          placement: bid.placement || "" // Garante que 'placement' seja string
        }));

        // Substituindo window.confirm por um log
        console.log(`Restaurar este backup irá substituir TODOS os dados de status atuais (${normalizedBidsFromFile.length} registros encontrados). Simule a confirmação.`);
        // if (!window.confirm(`Restaurar este backup irá substituir TODOS os dados...`)) return;

        await api.post('/api/restore-bids-backup', { licitacoes: normalizedBidsFromFile });
        // Isso atualiza o pai, que vai acionar nosso 'useEffect' e manter tudo sincronizado.
        setBids(normalizedBidsFromFile as any); // Usamos 'as any' para o setBids aceitar
        console.log('Backup restaurado com sucesso!');
        
      } catch (error) {
        console.error(`Ocorreu um erro ao restaurar o arquivo de backup: ${(error as Error).message}`);
      } finally {
        if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Andamento das Licitações</h2>
        <div className="flex items-center gap-2">
          <button onClick={handleBackup} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">
            Fazer Backup
          </button>
          <button onClick={handleRestoreClick} className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors">
            Restaurar Backup
          </button>
          <input type="file" ref={restoreInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
          <button onClick={() => showModal(null)} className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary transition-colors">
            Nova Licitação
          </button>
        </div>
      </div>

      {/* Verificamos o 'normalizedBids.length' */}
      {normalizedBids.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <h3 className="text-xl text-gray-700">Nenhuma licitação cadastrada ainda.</h3>
          <p className="text-gray-500 mt-2">Clique em "Nova Licitação" para começar a organizar seus processos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Fazemos o map em 'normalizedBids' */}
          {normalizedBids.map(bid => (
            <LicitacaoCard
              key={bid.id}
              bid={bid}
              onEdit={() => showModal(bid)}
              onDelete={() => handleDelete(bid.id)}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <LicitacaoModal
          bid={editingBid}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

// 2) Card com a borda e o fundo vindo por último
const LicitacaoCard: React.FC<{ bid: LicitacaoDetalhada; onEdit: () => void; onDelete: () => void }> = ({ bid, onEdit, onDelete }) => {
  // Esta função agora sempre receberá um status normalizado (ex: "Em Andamento")
  // por causa da nossa correção lá em cima.
  const statusStyles = getStatusStyles(bid.status);
  const highlightClass = getDateHighlightClass(bid);

  return (
    <div
      className={`
        rounded-lg shadow-md p-5 flex flex-col gap-3
        border
        ${statusStyles.background} /* Nova classe de fundo */
        ${statusStyles.border}   /* A borda vem por último, então ganha */
        transition-all hover:shadow-xl hover:-translate-y-1
        ${highlightClass}
        ${bid.status === StatusLicitacaoDetalhada.DESCLASSIFICADA ? 'grayscale opacity-70' : ''}
      `}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-lg text-gray-800 truncate">{bid.bidNumber}</h3>
          <p className="text-sm text-gray-500 truncate">{bid.city}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onEdit} className="text-gray-400 hover:text-primary p-1" aria-label="Editar">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600 p-1" aria-label="Excluir">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"></path></svg>
          </button>
        </div>
      </div>

      <div className="text-sm space-y-2 text-gray-600">
        <p><strong className="font-medium text-gray-800">Empresa:</strong> {bid.companyName}</p>
        <p><strong className="font-medium text-gray-800">Data:</strong> {formatDate(bid.realizationDate)}</p>
        {bid.progressForecast && (
          <p><strong className="font-medium text-gray-800">Previsão:</strong> {bid.progressForecast}</p>
        )}
        <p>
          <strong className="font-medium text-gray-800">Plataforma:</strong>{' '}
          <a href={bid.platformLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
            {bid.platformLink}
          </a>
        </p>
      </div>

      <div className="mt-auto pt-3 border-t border-gray-200 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles.pill}`}>
            {bid.status}
          </span>
          {/* Este check funciona para string vazia (que é 'falsy') */}
          {bid.placement && (
            <span>
              <strong className="font-medium">Colocação:</strong> {bid.placement}
            </span>
          )}
        </div>
        {bid.lastUpdated && (
          <p className="text-xs text-gray-400 text-right">
            Atualizado em: {formatDateTime(bid.lastUpdated)}
          </p>
        )}
      </div>
    </div>
  );
};

// Modal continua igual
const LicitacaoModal: React.FC<{ bid: LicitacaoDetalhada | null; onClose: () => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void }> = ({ bid, onClose, onSubmit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={onSubmit}>
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold text-gray-800">{bid ? 'Editar Licitação' : 'Adicionar Licitação'}</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
              <input type="text" id="companyName" name="companyName" defaultValue={bid?.companyName} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
                <input type="text" id="city" name="city" defaultValue={bid?.city} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="bidNumber" className="block text-sm font-medium text-gray-700">N° Licitação</label>
                <input type="text" id="bidNumber" name="bidNumber" defaultValue={bid?.bidNumber} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="platformLink" className="block text-sm font-medium text-gray-700">Link da Plataforma</label>
              <input type="url" id="platformLink" name="platformLink" defaultValue={bid?.platformLink} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="realizationDate" className="block text-sm font-medium text-gray-700">Data de Realização</label>
                <input type="date" id="realizationDate" name="realizationDate" defaultValue={bid?.realizationDate?.split('T')[0]} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select id="status" name="status" defaultValue={bid?.status} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                  {Object.values(StatusLicitacaoDetalhada).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="placement" className="block text-sm font-medium text-gray-700">Colocação</label>
              {/* O 'defaultValue' funciona bem com string obrigatória */}
              <input type="text" id="placement" name="placement" defaultValue={bid?.placement} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="Ex: 1º Lugar, Desclassificado, etc." />
            </div>
            <div>
              <label htmlFor="progressForecast" className="block text-sm font-medium text-gray-700">Previsão de Andamento</label>
              <textarea id="progressForecast" name="progressForecast" defaultValue={bid?.progressForecast ?? ''} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="Ex: Aguardando resultado, Em fase de recurso, etc."></textarea>
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-primary border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusLicitacoes;
