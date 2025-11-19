
import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { LicitacaoDetalhada, StatusLicitacaoDetalhada } from '../types';
import { api } from '../utils/api';

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

// Função para garantir que o status venha correto do banco ou do input
const normalizeStatus = (status: string): StatusLicitacaoDetalhada => {
  if (!status) return StatusLicitacaoDetalhada.ENCERRADA;

  const value = status.trim();
  // Verifica se o valor já é um valor válido do enum
  for (const key in StatusLicitacaoDetalhada) {
    if (StatusLicitacaoDetalhada[key as keyof typeof StatusLicitacaoDetalhada] === value) {
      return value as StatusLicitacaoDetalhada;
    }
  }

  // Tenta normalizar baseado no texto
  const lowerStatus = value.toLowerCase();
  if (lowerStatus.includes('andamento')) return StatusLicitacaoDetalhada.EM_ANDAMENTO;
  if (lowerStatus.includes('vencida')) return StatusLicitacaoDetalhada.VENCIDA;
  if (lowerStatus.includes('encerrada')) return StatusLicitacaoDetalhada.ENCERRADA;
  if (lowerStatus.includes('desclassificada')) return StatusLicitacaoDetalhada.DESCLASSIFICADA;
  
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

  // Estado interno para guardar os dados normalizados para exibição
  const [normalizedBids, setNormalizedBids] = useState<LicitacaoDetalhada[]>([]);

  useEffect(() => {
    if (bids) {
      const normalized = bids.map(bid => ({
        ...bid,
        status: normalizeStatus(bid.status as string),
        placement: bid.placement || "",
        progressForecast: bid.progressForecast || ""
      }));
      setNormalizedBids(normalized);
    } 
  }, [bids]);

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
    // Remove 'id' e 'lastUpdated' dos dados do formulário, pois serão gerados/atualizados pelo back ou aqui
    const { id, lastUpdated, ...bidData } = Object.fromEntries(formData.entries()) as any as LicitacaoDetalhada;

    const now = new Date().toISOString();
    // Normaliza o status antes de enviar
    const statusNormalizado = normalizeStatus(bidData.status as string);

    try {
      if (editingBid) {
        const updatedBid = { 
          ...editingBid, 
          ...bidData, 
          lastUpdated: now, 
          status: statusNormalizado,
          placement: bidData.placement || "", 
          progressForecast: bidData.progressForecast || ""
        };
        
        // CHAMADA REAL PARA A API
        const savedBid = await api.put(`/api/licitacoes/${editingBid.id}`, updatedBid);
        
        setBids(currentBids => currentBids.map(b => (b.id === editingBid.id ? savedBid : b)));
      } else {
        const newBidPayload = {
          ...bidData,
          lastUpdated: now,
          status: statusNormalizado,
          placement: bidData.placement || "", 
          progressForecast: bidData.progressForecast || ""
        };

        // CHAMADA REAL PARA A API
        const savedBid = await api.post('/api/licitacoes', newBidPayload);
        
        setBids(currentBids => [...currentBids, savedBid]);
      }
      closeModal();
    } catch (error) {
      console.error(`Falha ao salvar licitação: ${(error as Error).message}`);
      alert(`Erro ao salvar: ${(error as Error).message}`);
    }
  };

  const handleDelete = async (bidId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta licitação?')) return;
    
    try {
      // CHAMADA REAL PARA A API
      await api.delete(`/api/licitacoes/${bidId}`);
      setBids(currentBids => currentBids.filter(b => b.id !== bidId));
    } catch (error) {
      console.error(`Falha ao excluir licitação: ${(error as Error).message}`);
      alert(`Erro ao excluir: ${(error as Error).message}`);
    }
  };

  const handleBackup = () => {
    if (normalizedBids.length === 0) {
      alert('Não há dados para fazer backup.');
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
      alert('Por favor, selecione um arquivo de backup .json válido.');
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
          throw new Error('Formato inválido. Esperado array de licitações.');
        }

        const normalizedBidsFromFile = licitacoesToRestore.map((bid: any) => ({
          ...bid,
          status: normalizeStatus(bid.status),
          placement: bid.placement || "",
          progressForecast: bid.progressForecast || ""
        }));

        if (!window.confirm(`Restaurar este backup irá substituir TODOS os dados atuais (${normalizedBidsFromFile.length} registros encontrados). Continuar?`)) return;

        // CHAMADA REAL PARA A API
        await api.post('/api/restore-bids-backup', { licitacoes: normalizedBidsFromFile });
        
        // Atualiza o estado local
        setBids(normalizedBidsFromFile as any); 
        alert('Backup restaurado com sucesso!');
        
      } catch (error) {
        alert(`Erro ao restaurar: ${(error as Error).message}`);
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

      {normalizedBids.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <h3 className="text-xl text-gray-700">Nenhuma licitação cadastrada ainda.</h3>
          <p className="text-gray-500 mt-2">Clique em "Nova Licitação" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

const LicitacaoCard: React.FC<{ bid: LicitacaoDetalhada; onEdit: () => void; onDelete: () => void }> = ({ bid, onEdit, onDelete }) => {
  const statusStyles = getStatusStyles(bid.status);
  const highlightClass = getDateHighlightClass(bid);

  return (
    <div
      className={`
        rounded-lg shadow-md p-5 flex flex-col gap-3
        border
        ${statusStyles.background}
        ${statusStyles.border}
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
              <input type="text" id="placement" name="placement" defaultValue={bid?.placement} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="Ex: 1º Lugar, Desclassificado, etc." />
            </div>
            <div>
              <label htmlFor="progressForecast" className="block text-sm font-medium text-gray-700">Previsão de Andamento</label>
              <textarea id="progressForecast" name="progressForecast" defaultValue={bid?.progressForecast} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="Ex: Aguardando resultado, Em fase de recurso, etc."></textarea>
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
