import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api'; 
import { InvoiceData, Entity, InvoiceStatus } from '../types';
import { parseNfeXml } from '../services/xmlImporter';
// --- LINHA DE IMPORT CORRIGIDA: Adicionado Loader2 e renomeado History para HistoryIcon ---
import { Search, Copy, Printer, FileCode, XCircle, FileText, ArrowRightCircle, Download, CheckSquare, Square, UploadCloud, AlertTriangle, Edit3, Trash2, Loader2, History as HistoryIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface InvoiceHistoryProps {
  activeProfile: Entity | null;
  onDuplicate: (invoice: InvoiceData) => void;
  onComplementary: (invoice: InvoiceData) => void;
  onPrint: (invoice: InvoiceData) => void;
  onRequestCancel: (invoice: InvoiceData) => void;
  onRequestCorrection: (invoice: InvoiceData) => void;
  onEditDraft: (invoice: InvoiceData) => void;
}

// Helper para formatar o status com cores
const getStatusClasses = (status?: InvoiceStatus) => {
    switch (status) {
        case 'authorized':
            return 'bg-green-100 text-green-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        case 'draft':
            return 'bg-gray-100 text-gray-800';
        case 'error':
        case 'rejected':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-blue-100 text-blue-800';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'draft': return 'Rascunho';
        case 'cancelled': return 'Cancelada';
        case 'authorized': return 'Autorizada';
        case 'rejected': return 'Denegada';
        case 'error': return 'Erro';
        default: return status;
    }
};


export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ 
    activeProfile,
    onDuplicate, 
    onComplementary, 
    onPrint, 
    onRequestCancel, 
    onRequestCorrection,
    onEditDraft
}) => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // PAGINAÇÃO E FILTROS
  const [filters, setFilters] = useState({
    term: '',
    dateStart: '',
    dateEnd: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30; // 30 itens por página

  const fileInputRef = useRef<HTMLInputElement>(null);

  // CARREGAR DADOS DA API
  const loadData = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
        const data = await api.get('/api/nfe/notas');
        
        const cleanCnpj = (s: string) => s?.replace(/\D/g, '') || '';
        const activeCnpj = cleanCnpj(activeProfile.cnpj);
        
        const profileInvoices = Array.isArray(data) 
            ? data.filter((inv: InvoiceData) => cleanCnpj(inv.emitente.cnpj) === activeCnpj)
            : [];

        setInvoices(profileInvoices);
        setCurrentPage(1); // Volta para a primeira página ao carregar novos dados
    } catch (error) {
        console.error("Erro ao carregar notas fiscais:", error);
        setInvoices([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProfile]);

  // --- NOVAS FUNÇÕES DE AÇÃO ---

  // 1. Excluir Nota Fiscal (Permanente)
  const handleDeleteInvoice = async (id?: string) => {
    if (!id || !window.confirm("Tem certeza que deseja EXCLUIR permanentemente esta nota fiscal do sistema?")) return;
    
    setLoading(true);
    try {
        await api.delete(`/api/nfe/notas/${id}`);
        alert("Nota fiscal excluída com sucesso.");
        loadData();
    } catch (error) {
        console.error("Erro ao excluir nota:", error);
        alert("Erro ao excluir nota fiscal.");
    }
  };

  // 2. Alterar Status Manualmente
  const handleForceStatusUpdate = async (invoice: InvoiceData, newStatus: InvoiceStatus) => {
    if (!invoice.id || !window.confirm(`Tem certeza que deseja alterar o status da nota ${invoice.numero} para ${newStatus.toUpperCase()}?`)) return;

    setLoading(true);
    try {
        // Envia o objeto completo da nota com o novo status
        await api.post('/api/nfe/notas', { ...invoice, status: newStatus });
        alert(`Status da nota ${invoice.numero} alterado para ${newStatus.toUpperCase()} com sucesso.`);
        loadData();
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Erro ao atualizar status da nota fiscal.");
    }
  };

  // 3. Download XML
  const downloadXml = (invoice: InvoiceData) => {
      if(!invoice.xmlAssinado) {
          alert(`XML não encontrado para nota ${invoice.numero}.`);
          return;
      }
      const blob = new Blob([invoice.xmlAssinado], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.chaveAcesso}-nfe.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };


  // --- FUNÇÃO DE IMPORTAÇÃO XML CORRIGIDA (com detecção de status) ---
  const handleImportXml = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        let importedCount = 0;
        let errors = 0;

        const processFile = async (file: File) => {
            try {
                const invoice = await parseNfeXml(file);
                
                const cleanCnpj = (s: string) => s.replace(/\D/g, '');
                if (cleanCnpj(invoice.emitente.cnpj) !== cleanCnpj(activeProfile!.cnpj)) {
                    throw new Error(`CNPJ do XML (${invoice.emitente.cnpj}) não pertence ao perfil ativo.`);
                }

                // DETECÇÃO DE STATUS: Verifica se o XML é de Cancelamento ou Denegação
                const textContent = await file.text();
                let statusToSave: InvoiceStatus = 'authorized'; 
                
                if (textContent.includes('<cStat>101</cStat>')) {
                    statusToSave = 'cancelled';
                } else if (textContent.includes('<cStat>302</cStat>')) {
                    statusToSave = 'rejected';
                }

                // O servidor faz o UPSERT (cria se novo, atualiza se existente pela Chave de Acesso)
                await api.post('/api/nfe/notas', { ...invoice, status: statusToSave });
                importedCount++;
            } catch (err) {
                console.error(err);
                errors++;
            }
        };

        setLoading(true);
        Promise.all(files.map(processFile)).then(() => {
            alert(`Importação concluída!\nSucesso: ${importedCount}\nErros/Ignorados: ${errors}`);
            loadData();
            if (fileInputRef.current) fileInputRef.current.value = '';
        });
    }
  };
  
  // --- LÓGICA DE FILTRAGEM E PAGINAÇÃO ---
  const filteredInvoices = invoices.filter(inv => {
    const term = filters.term.toLowerCase();
    const matchTerm = 
        inv.numero.includes(term) || 
        inv.serie.includes(term) ||
        (inv.chaveAcesso || '').includes(term) || 
        (inv.destinatario.razaoSocial || '').toLowerCase().includes(term);
    
    let matchDate = true;
    if (filters.dateStart) matchDate = matchDate && new Date(inv.dataEmissao) >= new Date(filters.dateStart);
    if (filters.dateEnd) matchDate = matchDate && new Date(inv.dataEmissao) <= new Date(filters.dateEnd);
    
    return matchTerm && matchDate;
  });

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = filteredInvoices.slice(
      (currentPage - 1) * ITEMS_PER_PAGE, 
      currentPage * ITEMS_PER_PAGE
  );

  const toggleSelectAll = () => {
      if (selectedIds.length === paginatedInvoices.length) setSelectedIds([]);
      else setSelectedIds(paginatedInvoices.map(inv => inv.id!));
  };

  const toggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <HistoryIcon className="w-6 h-6 mr-3 text-primary-600" /> {/* HistoryIcon CORRIGIDO */}
            Histórico de Notas Fiscais
        </h2>

        {/* --- FILTROS, DATAS E BOTÕES DE LOTE --- */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pesquisar</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Número, chave ou destinatário..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.term}
                        onChange={(e) => { setFilters({...filters, term: e.target.value}); setCurrentPage(1); }}
                    />
                </div>
            </div>
            
            <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={filters.dateStart} onChange={e => { setFilters({...filters, dateStart: e.target.value}); setCurrentPage(1); }} />
            </div>
            <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={filters.dateEnd} onChange={e => { setFilters({...filters, dateEnd: e.target.value}); setCurrentPage(1); }} />
            </div>

            <div className="self-end pt-5">
                <button 
                    onClick={handleBulkExport}
                    disabled={selectedIds.length === 0}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar XMLs ({selectedIds.length})
                </button>
            </div>
        </div>

        {/* Tabela de Notas Fiscais */}
        <div className="bg-white rounded-lg overflow-x-auto shadow-sm border">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input 
                                type="checkbox" 
                                className="rounded text-primary-600 focus:ring-primary-500"
                                checked={selectedIds.length > 0 && selectedIds.length === paginatedInvoices.length}
                                onChange={toggleSelectAll}
                            />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Nota</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatário</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Emissão</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading && (
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                                Carregando notas...
                            </td>
                        </tr>
                    )}
                    {!loading && paginatedInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input 
                                    type="checkbox" 
                                    className="rounded text-primary-600 focus:ring-primary-500"
                                    checked={selectedIds.includes(inv.id!)}
                                    onChange={() => toggleSelect(inv.id!)}
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(inv.status)}`}>
                                    {getStatusLabel(inv.status || 'authorized')}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.numero} / {inv.serie}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.destinatario.razaoSocial}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 text-right">
                                {inv.totais ? inv.totais.vNF.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <div className="flex justify-center items-center space-x-1">
                                    
                                    {/* Botão de Excluir (Permanente) */}
                                    <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1.5 text-red-700 hover:bg-red-100 rounded" title="EXCLUIR Nota do Sistema (Permanente)">
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    {/* Botão de Forçar Cancelamento (NOVO) */}
                                    {inv.status !== 'cancelled' && (
                                        <button onClick={() => handleForceStatusUpdate(inv, 'cancelled')} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Forçar status para Cancelada (Apenas no Sistema)">
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Botões de Ações Comuns */}
                                    {inv.status !== 'draft' && (
                                        <>
                                            <button onClick={() => onPrint(inv)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Imprimir DANFE">
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => downloadXml(inv)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Baixar XML">
                                                <FileCode className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}

                                </div>
                            </td>
                        </tr>
                    ))}
                    {!loading && filteredInvoices.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                Nenhuma nota fiscal encontrada com os filtros atuais.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* CONTROLES DE PAGINAÇÃO */}
        {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                <span className="text-sm text-gray-600">
                    Mostrando notas {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)} de {filteredInvoices.length}
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 text-sm"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                    </button>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 text-sm"
                    >
                        Próximo <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
