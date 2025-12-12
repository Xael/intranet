import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api'; // <--- Mudança: Usando API em vez de db
import { InvoiceData, Entity } from '../types';
import { parseNfeXml } from '../services/xmlImporter';
import { Search, Copy, Printer, FileCode, XCircle, FileText, ArrowRightCircle, Download, CheckSquare, Square, UploadCloud, AlertTriangle, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';

interface InvoiceHistoryProps {
  activeProfile: Entity | null;
  onDuplicate: (invoice: InvoiceData) => void;
  onComplementary: (invoice: InvoiceData) => void;
  onPrint: (invoice: InvoiceData) => void;
  onRequestCancel: (invoice: InvoiceData) => void;
  onRequestCorrection: (invoice: InvoiceData) => void;
  onEditDraft: (invoice: InvoiceData) => void;
}

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
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // PAGINAÇÃO E FILTROS
  const [filters, setFilters] = useState({ term: '', dateStart: '', dateEnd: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30; // <--- Pedido: 30 itens por página

  const fileInputRef = useRef<HTMLInputElement>(null);

  // CARREGAR DADOS DA API
  const loadData = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
        // A API agora já retorna ordenado por dataEmissao DESC (graças à alteração no server.js)
        const data = await api.get('/api/nfe/notas');
        
        // Filtra para garantir que só mostra notas da empresa ativa
        const cleanCnpj = (s: string) => s?.replace(/\D/g, '') || '';
        const activeCnpj = cleanCnpj(activeProfile.cnpj);
        
        const profileInvoices = Array.isArray(data) 
            ? data.filter((inv: InvoiceData) => cleanCnpj(inv.emitente.cnpj) === activeCnpj)
            : [];

        setInvoices(profileInvoices);
    } catch (error) {
        console.error("Erro ao carregar notas:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProfile]);

// IMPORTAÇÃO XML (COM DETECÇÃO DE STATUS E AUTO-CADASTRO)
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

                // 3. DETECÇÃO DE STATUS (NOVA LÓGICA)
                // Lemos o arquivo como texto para procurar as tags de status (cStat)
                // 100 = Autorizada | 101 = Cancelada | 302 = Denegada
                const textContent = await file.text();
                let statusToSave = 'authorized'; // Padrão
                
                if (textContent.includes('<cStat>101</cStat>')) {
                    statusToSave = 'cancelled';
                } else if (textContent.includes('<cStat>302</cStat>')) {
                    statusToSave = 'rejected'; // ou 'error'
                }

                // 4. Envia para API com o status correto
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

  const handleBulkExport = () => {
      if (selectedIds.length === 0) {
          alert("Selecione pelo menos uma nota para exportar.");
          return;
      }
      const selectedInvoices = invoices.filter(inv => selectedIds.includes(inv.id!));
      if (confirm(`Deseja baixar os XMLs de ${selectedInvoices.length} notas selecionadas?`)) {
          selectedInvoices.forEach((inv, index) => {
              setTimeout(() => downloadXml(inv), index * 500); 
          });
      }
  };

  // LÓGICA DE FILTRAGEM
  const filteredInvoices = invoices.filter(inv => {
    const term = filters.term.toLowerCase();
    const matchTerm = 
        inv.numero.includes(term) || 
        inv.destinatario.razaoSocial.toLowerCase().includes(term) ||
        (inv.chaveAcesso && inv.chaveAcesso.includes(term));
    
    let matchDate = true;
    if (filters.dateStart) matchDate = matchDate && new Date(inv.dataEmissao) >= new Date(filters.dateStart);
    if (filters.dateEnd) matchDate = matchDate && new Date(inv.dataEmissao) <= new Date(filters.dateEnd);
    
    return matchTerm && matchDate;
  });

  // LÓGICA DE PAGINAÇÃO
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

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'draft': return 'bg-gray-100 text-gray-800';
          case 'cancelled': return 'bg-red-100 text-red-800';
          case 'authorized': return 'bg-green-100 text-green-800';
          default: return 'bg-blue-100 text-blue-800';
      }
  };

  const getStatusLabel = (status: string) => {
      switch (status) {
          case 'draft': return 'Rascunho';
          case 'cancelled': return 'Cancelada';
          case 'authorized': return 'Autorizada';
          default: return status;
      }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
            <div className="flex items-center text-blue-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Empresa Ativa: <strong>{activeProfile?.razaoSocial}</strong></span>
            </div>
            <div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-md hover:bg-blue-100 transition-colors shadow-sm text-sm font-medium"
                >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Importar XML Externo
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xml" multiple onChange={handleImportXml} />
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pesquisar</label>
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Número, Destinatário ou Chave..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.term}
                        onChange={e => { setFilters({...filters, term: e.target.value}); setCurrentPage(1); }}
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
            </div>
            <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={filters.dateStart} onChange={e => setFilters({...filters, dateStart: e.target.value})} />
            </div>
            <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={filters.dateEnd} onChange={e => setFilters({...filters, dateEnd: e.target.value})} />
            </div>
            <div className="w-full md:w-auto">
                <button onClick={handleBulkExport} disabled={selectedIds.length === 0} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 w-full justify-center">
                    <Download className="w-4 h-4 mr-2" /> Exportar ({selectedIds.length})
                </button>
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
                <div className="p-10 text-center text-gray-500">Carregando notas...</div>
            ) : (
                <>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <button onClick={toggleSelectAll} className="text-gray-500 hover:text-blue-600">
                                        {selectedIds.length > 0 && selectedIds.length === paginatedInvoices.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Número / Série</th>
                                <th className="px-6 py-3">Emissão</th>
                                <th className="px-6 py-3">Destinatário</th>
                                <th className="px-6 py-3">Valor</th>
                                <th className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedInvoices.map(inv => (
                                <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(inv.id!) ? 'bg-blue-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleSelect(inv.id!)} className="text-gray-400 hover:text-blue-600">
                                            {selectedIds.includes(inv.id!) ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status || 'authorized')}`}>
                                            {getStatusLabel(inv.status || 'authorized')}
                                        </span>
                                        {inv.historicoEventos?.some(e => e.tipo === 'cce') && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">CC-e</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono">{inv.numero} <span className="text-gray-400">/</span> {inv.serie}</td>
                                    <td className="px-6 py-4">{new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 max-w-xs truncate" title={inv.destinatario.razaoSocial}>{inv.destinatario.razaoSocial}</td>
                                    <td className="px-6 py-4 font-medium">R$ {inv.totais.vNF.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center space-x-2">
                                            {inv.status === 'draft' ? (
                                                <>
                                                    <button onClick={() => onEditDraft(inv)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Editar"><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={() => onRequestCancel(inv)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir"><XCircle className="w-4 h-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => onPrint(inv)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Imprimir"><Printer className="w-4 h-4" /></button>
                                                    <button onClick={() => downloadXml(inv)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="XML"><FileCode className="w-4 h-4" /></button>
                                                    <button onClick={() => onDuplicate(inv)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Duplicar"><Copy className="w-4 h-4" /></button>
                                                    <button onClick={() => onComplementary(inv)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Comp."><ArrowRightCircle className="w-4 h-4" /></button>
                                                    {inv.status !== 'cancelled' && (
                                                        <>
                                                            <button onClick={() => onRequestCorrection(inv)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="CC-e"><FileText className="w-4 h-4" /></button>
                                                            <button onClick={() => onRequestCancel(inv)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancelar"><XCircle className="w-4 h-4" /></button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedInvoices.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Nenhuma nota encontrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* CONTROLES DE PAGINAÇÃO */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
                        <span className="text-sm text-gray-600">
                            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
                            >
                                Próximo <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                )}
                </>
            )}
        </div>
    </div>
  );
};
