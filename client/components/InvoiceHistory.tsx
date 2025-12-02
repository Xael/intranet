
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/storage';
import { InvoiceData, Entity } from '../types';
import { parseNfeXml } from '../services/xmlImporter';
import { Search, Copy, Printer, FileCode, XCircle, FileText, ArrowRightCircle, Download, CheckSquare, Square, UploadCloud, AlertTriangle, Edit3 } from 'lucide-react';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    term: '',
    dateStart: '',
    dateEnd: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    if (!activeProfile) return;
    
    // Clean CNPJ for comparison
    const cleanCnpj = (s: string) => s.replace(/\D/g, '');
    const activeCnpj = cleanCnpj(activeProfile.cnpj);

    const allInvoices = db.get<InvoiceData>('invoices');
    
    // Filter invoices where the Issuer CNPJ matches the Active Profile CNPJ
    const profileInvoices = allInvoices.filter(inv => 
        cleanCnpj(inv.emitente.cnpj) === activeCnpj
    );

    setInvoices(profileInvoices.reverse());
  };

  useEffect(() => {
    loadData();
  }, [activeProfile]);

  const handleImportXml = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        let importedCount = 0;
        let errors = 0;

        const processFile = async (file: File) => {
            try {
                const invoice = await parseNfeXml(file);
                
                // Security Check: Does the XML Issuer match the Active Profile?
                const cleanCnpj = (s: string) => s.replace(/\D/g, '');
                if (cleanCnpj(invoice.emitente.cnpj) !== cleanCnpj(activeProfile!.cnpj)) {
                    throw new Error(`CNPJ do XML (${invoice.emitente.cnpj}) não pertence ao perfil ativo.`);
                }

                // Check for duplicates
                const exists = db.get<InvoiceData>('invoices').some(i => i.chaveAcesso === invoice.chaveAcesso);
                if (!exists) {
                    db.save('invoices', invoice);
                    importedCount++;
                }
            } catch (err) {
                console.error(err);
                errors++;
            }
        };

        // Process all files
        Promise.all(files.map(processFile)).then(() => {
            alert(`Importação concluída!\nSucesso: ${importedCount}\nErros/Ignorados: ${errors}`);
            loadData();
            if (fileInputRef.current) fileInputRef.current.value = '';
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

  const toggleSelectAll = () => {
      if (selectedIds.length === filteredInvoices.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filteredInvoices.map(inv => inv.id!));
      }
  };

  const toggleSelect = (id: string) => {
      setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
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

  const filteredInvoices = invoices.filter(inv => {
    const matchTerm = 
        inv.numero.includes(filters.term) || 
        inv.destinatario.razaoSocial.toLowerCase().includes(filters.term.toLowerCase()) ||
        inv.chaveAcesso?.includes(filters.term);
    
    let matchDate = true;
    if (filters.dateStart) {
        matchDate = matchDate && new Date(inv.dataEmissao) >= new Date(filters.dateStart);
    }
    if (filters.dateEnd) {
        matchDate = matchDate && new Date(inv.dataEmissao) <= new Date(filters.dateEnd);
    }
    
    return matchTerm && matchDate;
  });

  return (
    <div className="space-y-6">
        {/* Header with Import Action */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
            <div className="flex items-center text-blue-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Você está visualizando as notas da empresa: <strong>{activeProfile?.razaoSocial}</strong></span>
            </div>
            <div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-md hover:bg-blue-100 transition-colors shadow-sm text-sm font-medium"
                >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Importar XML Externo
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xml" 
                    multiple
                    onChange={handleImportXml} 
                />
            </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pesquisar</label>
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Número, Destinatário ou Chave..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
                        value={filters.term}
                        onChange={e => setFilters({...filters, term: e.target.value})}
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
            </div>
            
            <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input 
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
                    value={filters.dateStart}
                    onChange={e => setFilters({...filters, dateStart: e.target.value})}
                />
            </div>

            <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input 
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
                    value={filters.dateEnd}
                    onChange={e => setFilters({...filters, dateEnd: e.target.value})}
                />
            </div>

            <div className="w-full md:w-auto flex gap-2">
                <button 
                    onClick={handleBulkExport}
                    disabled={selectedIds.length === 0}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar XMLs ({selectedIds.length})
                </button>
            </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-3 w-10">
                                <button onClick={toggleSelectAll} className="text-gray-500 hover:text-primary-600">
                                    {selectedIds.length > 0 && selectedIds.length === filteredInvoices.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
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
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(inv.id!) ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <button onClick={() => toggleSelect(inv.id!)} className="text-gray-400 hover:text-primary-600">
                                        {selectedIds.includes(inv.id!) ? <CheckSquare className="w-5 h-5 text-primary-600" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status || 'authorized')}`}>
                                        {getStatusLabel(inv.status || 'authorized')}
                                    </span>
                                    {inv.historicoEventos?.some(e => e.tipo === 'cce') && (
                                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            CC-e
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    {inv.numero} <span className="text-gray-400">/</span> {inv.serie}
                                </td>
                                <td className="px-6 py-4">
                                    {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate" title={inv.destinatario.razaoSocial}>
                                    {inv.destinatario.razaoSocial}
                                </td>
                                <td className="px-6 py-4 font-medium">
                                    R$ {inv.totais.vNF.toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center space-x-2">
                                        {inv.status === 'draft' ? (
                                            <>
                                                <button onClick={() => onEditDraft(inv)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Editar Rascunho">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <div className="w-px h-4 bg-gray-300 mx-1 self-center"></div>
                                                <button onClick={() => onRequestCancel(inv)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir Rascunho">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => onPrint(inv)} className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded" title="Imprimir PDF/DANFE">
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => downloadXml(inv)} className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded" title="Baixar XML">
                                                    <FileCode className="w-4 h-4" />
                                                </button>
                                                <div className="w-px h-4 bg-gray-300 mx-1 self-center"></div>
                                                <button onClick={() => onDuplicate(inv)} className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded" title="Duplicar Nota">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => onComplementary(inv)} className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded" title="Nota Complementar">
                                                    <ArrowRightCircle className="w-4 h-4" />
                                                </button>
                                                {inv.status !== 'cancelled' && (
                                                    <>
                                                        <button onClick={() => onRequestCorrection(inv)} className="p-1.5 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded" title="Carta de Correção">
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => onRequestCancel(inv)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded" title="Cancelar Nota">
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredInvoices.length === 0 && (
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
    </div>
  );
};
