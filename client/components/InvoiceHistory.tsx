import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api'; // Usando a API real
import { InvoiceData, Entity, InvoiceStatus } from '../types';
import { parseNfeXml } from '../services/xmlImporter';
import { Search, Copy, Printer, FileCode, XCircle, FileText, ArrowRightCircle, Download, CheckSquare, Square, UploadCloud, AlertTriangle, Edit3, Trash2 } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
        const response = await api.get('/api/nfe/notas');
        setInvoices(response.data);
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

  // --- NOVAS FUNÇÕES ---

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
    } finally {
        setLoading(false);
    }
  };

  // 2. Alterar Status Manualmente (Forçar Cancelada, etc.)
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
    } finally {
        setLoading(false);
    }
  };


  // --- FUNÇÃO DE IMPORTAÇÃO XML CORRIGIDA (com detecção de status) ---
  const handleImportXml = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        let importedCount = 0;
        let errors = 0;

        const processFile = async (file: File) => {
            try {
                // 1. Faz o Parse dos dados da nota
                const invoice = await parseNfeXml(file);
                
                // 2. Validação de Segurança: CNPJ bate com o perfil?
                const cleanCnpj = (s: string) => s.replace(/\D/g, '');
                if (cleanCnpj(invoice.emitente.cnpj) !== cleanCnpj(activeProfile!.cnpj)) {
                    throw new Error(`CNPJ do XML (${invoice.emitente.cnpj}) não pertence ao perfil ativo.`);
                }

                // 3. DETECÇÃO DE STATUS (Lê o texto do arquivo para procurar as tags de status)
                const textContent = await file.text();
                let statusToSave: InvoiceStatus = 'authorized'; // Padrão
                
                if (textContent.includes('<cStat>101</cStat>')) {
                    statusToSave = 'cancelled';
                } else if (textContent.includes('<cStat>302</cStat>')) {
                    statusToSave = 'rejected';
                }

                // 4. Envia para API com o status correto (o servidor fará o UPSERT pela Chave de Acesso)
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
            loadData(); // Atualiza a lista
            if (fileInputRef.current) fileInputRef.current.value = '';
            setLoading(false);
        });
    }
  };
  
  // ... (Restante das funções de filtro e UI) ...
  
  const filteredInvoices = invoices.filter(inv => {
    // Implementação simplificada do filtro (você pode customizar mais)
    const termMatch = filters.term === '' || 
                      inv.numero.includes(filters.term) || 
                      (inv.chaveAcesso || '').includes(filters.term) || 
                      (inv.destinatario.razaoSocial || '').toLowerCase().includes(filters.term.toLowerCase());
    
    // Filtros de data (incompleto no exemplo, mas fica aqui para referência)

    return termMatch;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedIds(filteredInvoices.map(inv => inv.id!));
    } else {
        setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleExportSelected = () => {
    // Implementação de exportação (se necessário)
    alert(`Exportando ${selectedIds.length} notas... (Função a ser implementada)`);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <History className="w-6 h-6 mr-3 text-primary-600" />
            Histórico de Notas Fiscais
        </h2>

        {/* ... (Filtros e Ações de Lote) ... */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Buscar por número, chave ou destinatário..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
                        value={filters.term}
                        onChange={(e) => setFilters({...filters, term: e.target.value})}
                    />
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <input 
                    type="file" 
                    accept=".xml" 
                    multiple 
                    onChange={handleImportXml}
                    ref={fileInputRef}
                    className="hidden"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    disabled={!activeProfile || loading}
                >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Importar XML
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
                                checked={selectedIds.length > 0 && selectedIds.length === filteredInvoices.length}
                                onChange={handleSelectAll}
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
                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary-500" />
                                Carregando notas...
                            </td>
                        </tr>
                    )}
                    {!loading && filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input 
                                    type="checkbox" 
                                    className="rounded text-primary-600 focus:ring-primary-500"
                                    checked={selectedIds.includes(inv.id!)}
                                    onChange={() => handleSelectOne(inv.id!)}
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(inv.status)}`}>
                                    {inv.status ? inv.status.toUpperCase() : 'N/D'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.numero}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.destinatario.razaoSocial}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 text-right">
                                {inv.totais ? inv.totais.vNF.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <div className="flex justify-center items-center space-x-1">
                                    
                                    {/* Botão de Excluir (NOVO) */}
                                    <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir Nota do Sistema">
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    {/* Botão de Forçar Cancelamento (NOVO) */}
                                    {inv.status !== 'cancelled' && (
                                        <button onClick={() => handleForceStatusUpdate(inv, 'cancelled')} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded" title="Alterar status para Cancelada (Local)">
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Botões de Ações Legais/Comuns (MANTIDOS) */}
                                    {inv.status === 'authorized' && (
                                        <>
                                            <button onClick={() => onPrint(inv)} className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded" title="Imprimir DANFE">
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onRequestCorrection(inv)} className="p-1.5 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded" title="Carta de Correção">
                                                <FileText className="w-4 h-4" />
                                            </button>
                                            {/* O botão abaixo é para solicitação no SEFAZ */}
                                            <button onClick={() => onRequestCancel(inv)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded" title="Solicitar Cancelamento (SEFAZ)">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}

                                    {inv.status === 'draft' && (
                                        <button onClick={() => onEditDraft(inv)} className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded" title="Editar Rascunho">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    )}

                                </div>
                            </td>
                        </tr>
                    ))}
                    {!loading && filteredInvoices.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                Nenhuma nota fiscal encontrada para este perfil.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};
