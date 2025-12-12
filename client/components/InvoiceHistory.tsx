import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api'; 
import { InvoiceData, Entity, InvoiceStatus } from '../types';
import { parseNfeXml } from '../services/xmlImporter';
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
   
  const [filters, setFilters] = useState({
    term: '',
    dateStart: '',
    dateEnd: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Inverte para mostrar as mais recentes primeiro
        setInvoices(profileInvoices.reverse());
        setCurrentPage(1); 
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

  // --- FUNÇÕES DE AÇÃO ---

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

  // 2. Excluir Múltiplas Notas Selecionadas (Lote)
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || !window.confirm(`Tem certeza que deseja EXCLUIR permanentemente as ${selectedIds.length} notas fiscais selecionadas?`)) return;

    setLoading(true);
    try {
        const deletePromises = selectedIds.map(id => api.delete(`/api/nfe/notas/${id}`));
        await Promise.all(deletePromises);
        
        alert(`${selectedIds.length} notas fiscais excluídas com sucesso.`);
        setSelectedIds([]);
        loadData();
    } catch (error) {
        console.error("Erro ao excluir em lote:", error);
        alert("Erro ao excluir notas fiscais em lote. Tente novamente.");
    }
  };

  // 3. Alterar Status Manualmente (CORRIGIDO PARA PORTUGUÊS / NUMÉRICO)
  const handleForceStatusUpdate = async (invoice: InvoiceData) => {
    const currentStatusLabel = getStatusLabel(invoice.status || 'authorized');

    const promptMessage = 
`ALTERAÇÃO MANUAL DE STATUS (Correção Local)
Nota Nº: ${invoice.numero} | Atual: ${currentStatusLabel}

Digite o número da opção desejada:
1 - Autorizada
2 - Cancelada
3 - Rejeitada
4 - Rascunho (Voltar para edição)

(Isso altera o status no banco de dados para fins de correção)`;

    const option = prompt(promptMessage);
    
    if (!option) return;

    let newStatus: InvoiceStatus | null = null;
    let newLabel = "";

    switch(option.trim()) {
        case '1': 
            newStatus = 'authorized'; 
            newLabel = "Autorizada";
            break;
        case '2': 
            newStatus = 'cancelled'; 
            newLabel = "Cancelada";
            break;
        case '3': 
            newStatus = 'rejected'; 
            newLabel = "Rejeitada";
            break;
        case '4': 
            newStatus = 'draft'; 
            newLabel = "Rascunho";
            break;
        default:
            alert("Opção inválida! Digite apenas o número (1, 2, 3 ou 4).");
            return;
    }

    if (invoice.status === newStatus) return;

    setLoading(true);
    try {
        await api.post('/api/nfe/notas', { ...invoice, status: newStatus });
        alert(`Sucesso! Status da nota ${invoice.numero} alterado para: ${newLabel}`);
        loadData();
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Erro ao atualizar status da nota fiscal no servidor.");
    } finally {
        setLoading(false);
    }
  };

  // 4. Download XML
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
   
  // 5. Visualizar XML
  // Removido para simplificar, já que downloadXml cobre o uso principal
  // (Pode ser readicionado se necessário)

  // 6. Exportação em Lote
  const handleBulkExport = () => {
      if (selectedIds.length === 0) {
          alert("Selecione pelo menos uma nota para exportar.");
          return;
      }
      const selectedInvoices = invoices.filter(inv => selectedIds.includes(inv.id!));
      if (window.confirm(`Deseja baixar os XMLs de ${selectedInvoices.length} notas selecionadas?`)) {
          // setLoading(true); // Opcional: pode bloquear a UI ou não
          selectedInvoices.forEach((inv, index) => {
              setTimeout(() => downloadXml(inv), index * 500); 
          });
          // Não bloqueamos loading aqui para permitir que o usuário continue navegando enquanto baixa
      }
  };


  // --- FUNÇÃO DE IMPORTAÇÃO XML ---
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

                const textContent = await file.text();
                let statusToSave: InvoiceStatus = 'authorized'; 
                
                // Tenta detectar status pelo conteúdo do XML (cStat)
                if (textContent.includes('<cStat>101</cStat>')) {
                    statusToSave = 'cancelled';
                } else if (textContent.includes('<cStat>302</cStat>')) {
                    statusToSave = 'rejected';
                }

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
            setLoading(false);
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
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 animate-fade-in">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <HistoryIcon className="w-6 h-6 mr-3 text-blue-600" /> 
            Histórico de Notas Fiscais
        </h2>

        {/* --- FILTROS, DATAS E BOTÕES DE LOTE --- */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
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

            <div className="self-end pt-5 flex gap-3">
                
                {/* BOTÃO IMPORTAR */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                    disabled={!activeProfile || loading}
                >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Importar XML
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xml" multiple onChange={handleImportXml} />

                {/* BOTÃO EXCLUIR EM LOTE */}
                {selectedIds.length > 1 && (
                    <button 
                        onClick={handleBulkDelete}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-opacity shadow-sm"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir ({selectedIds.length})
                    </button>
                )}

                <button 
                    onClick={handleBulkExport}
                    disabled={selectedIds.length === 0}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar XMLs ({selectedIds.length})
                </button>
            </div>
        </div>

        {/* Tabela de Notas Fiscais */}
        <div className="bg-white rounded-lg overflow-x-auto shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                            <input 
                                type="checkbox" 
                                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                                    <span>Carregando notas fiscais...</span>
                                </div>
                            </td>
                        </tr>
                    )}
                    {!loading && paginatedInvoices.map(inv => (
                        <tr key={inv.id} className={`hover:bg-blue-50 transition-colors ${selectedIds.includes(inv.id!) ? 'bg-blue-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input 
                                    type="checkbox" 
                                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={selectedIds.includes(inv.id!)}
                                    onChange={() => toggleSelect(inv.id!)}
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(inv.status)}`}>
                                    {getStatusLabel(inv.status || 'authorized')}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                                {inv.numero} <span className="text-gray-400">/</span> {inv.serie}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate" title={inv.destinatario.razaoSocial}>
                                {inv.destinatario.razaoSocial}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 text-right">
                                {inv.totais ? inv.totais.vNF.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <div className="flex justify-center space-x-1">
                                    
                                    {/* 1. EXCLUIR */}
                                    <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir Permanentemente">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    
                                    <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>

                                    {/* 2. IMPRIMIR */}
                                    <button onClick={() => onPrint(inv)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Imprimir DANFE">
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    
                                    {/* 3. DOWNLOAD XML */}
                                    <button onClick={() => downloadXml(inv)} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Download XML">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    
                                    {/* 4. EDITAR STATUS (Correção Manual) */}
                                    <button onClick={() => handleForceStatusUpdate(inv)} className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Corrigir Status Manualmente">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    
                                    <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>

                                    {/* 5. DUPLICAR */}
                                    <button onClick={() => onDuplicate(inv)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Duplicar Nota">
                                        <Copy className="w-4 h-4" />
                                    </button>

                                    {/* AÇÕES EXTRAS SE AUTORIZADA */}
                                    {(inv.status === 'authorized') && (
                                        <>
                                            <button onClick={() => onComplementary(inv)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Nota Complementar">
                                                <ArrowRightCircle className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onRequestCorrection(inv)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors" title="Carta de Correção">
                                                <FileText className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onRequestCancel(inv)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Cancelar na SEFAZ">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}

                                    {/* AÇÃO SE RASCUNHO */}
                                    {inv.status === 'draft' && (
                                        <button onClick={() => onEditDraft(inv)} className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Continuar Editando">
                                            <ArrowRightCircle className="w-4 h-4" />
                                        </button>
                                    )}

                                </div>
                            </td>
                        </tr>
                    ))}
                    {!loading && filteredInvoices.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center">
                                    <AlertTriangle className="w-10 h-10 text-gray-300 mb-2" />
                                    <p>Nenhuma nota encontrada com os filtros atuais.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* CONTROLES DE PAGINAÇÃO */}
        {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg mt-0">
                <span className="text-sm text-gray-600">
                    Mostrando <strong>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</strong> a <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)}</strong> de <strong>{filteredInvoices.length}</strong> notas
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                    </button>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                        Próximo <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
