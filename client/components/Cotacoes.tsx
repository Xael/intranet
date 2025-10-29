import React, { useState, useMemo, useRef } from 'react';
import { Cotacao, CotacaoItem, ValorReferencia, SimulacaoCotacaoItem, SimulacaoCotacaoSalva } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { api } from '../utils/api';

declare var XLSX: any;
declare var jsPDF: any;

const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CotacoesProps {
    cotacoes: Cotacao[];
    setCotacoes: React.Dispatch<React.SetStateAction<Cotacao[]>>;
    valoresReferencia: ValorReferencia[];
    setValoresReferencia: React.Dispatch<React.SetStateAction<ValorReferencia[]>>;
    simulacoesSalvas: SimulacaoCotacaoSalva[];
    setSimulacoesSalvas: React.Dispatch<React.SetStateAction<SimulacaoCotacaoSalva[]>>;
}

const Cotacoes: React.FC<CotacoesProps> = ({ cotacoes, setCotacoes, valoresReferencia, setValoresReferencia, simulacoesSalvas, setSimulacoesSalvas }) => {
    const [activeTab, setActiveTab] = useState('cotacoes');
    const [simulacaoItens, setSimulacaoItens] = useState<SimulacaoCotacaoItem[]>([]);
    const importFileRef = useRef<HTMLInputElement>(null);

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) throw new Error("A planilha está vazia.");

                // FIX: Use a generic type argument for the reduce function to ensure correct type inference for the accumulator.
                const groupedByCotacao = json.reduce<Record<string, any[]>>((acc, row) => {
                    const local = String(row['Local da Cotação'] || 'N/A').trim();
                    let data = String(row['Data'] || '').trim();
                    
                    if (data.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                        const [d, m, y] = data.split('/');
                        data = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
                    } else if (!data.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        data = new Date().toISOString().split('T')[0];
                    }

                    const key = `${local}|${data}`;
                    if (!acc[key]) acc[key] = [];

                    const qtd = parseFloat(row['Quantidade']);
                    const valUnit = parseFloat(row['Valor Unitário']);

                    if (row['Produto'] && !isNaN(qtd) && !isNaN(valUnit)) {
                       acc[key].push({
                            produto: String(row['Produto']),
                            unidade: String(row['Unidade'] || 'UN'),
                            quantidade: qtd,
                            valorUnitario: valUnit,
                            valorTotal: qtd * valUnit,
                            marca: String(row['Marca'] || ''),
                        });
                    }
                    return acc;
                }, {});

                const novasCotacoes = Object.entries(groupedByCotacao).map(([key, itens]) => {
                    const [local, data] = key.split('|');
                    return { local, data, itens };
                });
                
                await api.post('/api/cotacoes/import', { cotacoes: novasCotacoes });
                const updatedCotacoes = await api.get('/api/cotacoes');
                setCotacoes(updatedCotacoes);

                alert(`${novasCotacoes.length} cotação(ões) importada(s) com sucesso!`);

            } catch (error) {
                alert(`Erro ao importar: ${(error as Error).message}. Verifique se a planilha tem as colunas: Produto, Unidade, Quantidade, Valor Unitário, Marca, Local da Cotação, Data.`);
            } finally {
                if (importFileRef.current) importFileRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const TabButton: React.FC<{ tabId: string, label: string }> = ({ tabId, label }) => (
        <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Cotações e Simulações</h1>
             <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm"><nav className="-mb-px flex space-x-2">
                <TabButton tabId="cotacoes" label="Cotações Salvas" />
                <TabButton tabId="simulacao" label="Simulação Atual" />
                <TabButton tabId="simulacoes_salvas" label="Simulações Salvas" />
                <TabButton tabId="referencia" label="Valores de Referência" />
            </nav></div>

            <div className="bg-white p-6 rounded-b-lg shadow-md">
                {activeTab === 'cotacoes' && <CotacoesSalvasView cotacoes={cotacoes} setCotacoes={setCotacoes} setSimulacaoItens={setSimulacaoItens} valoresReferencia={valoresReferencia} handleImportClick={() => importFileRef.current?.click()} />}
                {activeTab === 'simulacao' && <SimulacaoAtualView simulacaoItens={simulacaoItens} setSimulacaoItens={setSimulacaoItens} setSimulacoesSalvas={setSimulacoesSalvas} valoresReferencia={valoresReferencia} />}
                {activeTab === 'simulacoes_salvas' && <SimulacoesSalvasView simulacoesSalvas={simulacoesSalvas} setSimulacoesSalvas={setSimulacoesSalvas} setSimulacaoItens={setSimulacaoItens} setActiveTab={setActiveTab}/>}
                {activeTab === 'referencia' && <ValoresReferenciaView valoresReferencia={valoresReferencia} setValoresReferencia={setValoresReferencia} />}
            </div>
            <input type="file" ref={importFileRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
        </div>
    );
};

// Sub-component views

const CotacoesSalvasView: React.FC<{
    cotacoes: Cotacao[],
    setCotacoes: React.Dispatch<React.SetStateAction<Cotacao[]>>,
    setSimulacaoItens: React.Dispatch<React.SetStateAction<SimulacaoCotacaoItem[]>>,
    valoresReferencia: ValorReferencia[],
    handleImportClick: () => void,
}> = ({ cotacoes, setCotacoes, setSimulacaoItens, valoresReferencia, handleImportClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCotacaoId, setExpandedCotacaoId] = useState<string | null>(null);

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const results: (CotacaoItem & { cotacao: Cotacao })[] = [];
        cotacoes.forEach(c => {
            c.itens.forEach(item => {
                if (item.produto.toLowerCase().includes(searchTerm.toLowerCase()) || item.marca.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push({ ...item, cotacao: c });
                }
            });
        });
        return results;
    }, [searchTerm, cotacoes]);

    const referenciaMap = useMemo(() => new Map(valoresReferencia.map(v => [v.id, v.valor])), [valoresReferencia]);
    const getComparisonClass = (produto: string, valor: number) => {
        const refValor = referenciaMap.get(produto.toLowerCase().trim());
        if (refValor === undefined) return '';
        return valor <= refValor ? 'text-green-600' : 'text-red-600';
    };
    
    const handleAddToSimulacao = (item: CotacaoItem, cotacao: Cotacao) => {
        setSimulacaoItens(prev => {
            const newItem: SimulacaoCotacaoItem = {
                ...item,
                cotacaoOrigem: { id: cotacao.id, local: cotacao.local, data: cotacao.data }
            };
            return [...prev, newItem];
        });
        alert(`'${item.produto}' adicionado à simulação.`);
    };

    const handleDeleteCotacao = async (cotacaoId: string, local: string) => {
        if(window.confirm(`Tem certeza que deseja excluir a cotação de "${local}"?`)) {
            try {
                await api.delete(`/api/cotacoes/${cotacaoId}`);
                setCotacoes(prev => prev.filter(cot => cot.id !== cotacaoId));
            } catch (error) {
                alert(`Erro ao excluir cotação: ${(error as Error).message}`);
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-full max-w-md">
                    <input type="text" placeholder="Buscar item em todas as cotações..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg"/>
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="text-right flex-shrink-0">
                    <button onClick={handleImportClick} className="flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary ml-auto">
                        <PlusIcon className="w-5 h-5 mr-2"/> Importar Cotação
                    </button>
                    <p className="text-xs text-gray-500 mt-1">A planilha deve ter: Produto, Unidade, Quantidade, Valor Unitário, Marca, Local da Cotação, Data.</p>
                </div>
            </div>

            {searchTerm ? (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr><th className="px-4 py-2">Produto</th><th className="px-4 py-2">Origem</th><th className="px-4 py-2 text-right">Valor</th><th className="px-4 py-2 text-center">Ações</th></tr></thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{item.produto} ({item.marca})</td>
                                    <td className="px-4 py-2 text-gray-600">{item.cotacao.local} - {new Date(item.cotacao.data  + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                    <td className={`px-4 py-2 text-right font-semibold ${getComparisonClass(item.produto, item.valorUnitario)}`}>{formatarMoeda(item.valorUnitario)}</td>
                                    <td className="px-4 py-2 text-center"><button onClick={() => handleAddToSimulacao(item, item.cotacao)} className="text-blue-600 text-xs">Add à Simulação</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-3">
                    {cotacoes.map(c => (
                        <div key={c.id} className="border rounded-lg">
                            <div onClick={() => setExpandedCotacaoId(expandedCotacaoId === c.id ? null : c.id)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                                <div>
                                    <p className="font-bold">{c.local}</p>
                                    <p className="text-sm text-gray-500">{new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')} - {c.itens.length} itens</p>
                                </div>
                                <TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-600" onClick={(e) => {e.stopPropagation(); handleDeleteCotacao(c.id, c.local)}}/>
                            </div>
                            {expandedCotacaoId === c.id && (
                                <div className="border-t p-2">
                                     <table className="w-full text-sm">
                                        <tbody>
                                            {c.itens.map(item => (
                                                <tr key={item.id} className="hover:bg-blue-50">
                                                    <td className="px-2 py-1">{item.produto}</td>
                                                    <td className={`px-2 py-1 text-right ${getComparisonClass(item.produto, item.valorUnitario)}`}>{formatarMoeda(item.valorUnitario)}</td>
                                                    <td className="px-2 py-1 text-center"><button onClick={() => handleAddToSimulacao(item, c)} className="text-blue-600 text-xs">Add</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SimulacaoAtualView: React.FC<{
    simulacaoItens: SimulacaoCotacaoItem[],
    setSimulacaoItens: React.Dispatch<React.SetStateAction<SimulacaoCotacaoItem[]>>,
    setSimulacoesSalvas: React.Dispatch<React.SetStateAction<SimulacaoCotacaoSalva[]>>,
    valoresReferencia: ValorReferencia[],
}> = ({ simulacaoItens, setSimulacaoItens, setSimulacoesSalvas, valoresReferencia }) => {
    
    const totalSimulacao = useMemo(() => simulacaoItens.reduce((acc, item) => acc + item.valorTotal, 0), [simulacaoItens]);
    const referenciaMap = useMemo(() => new Map(valoresReferencia.map(v => [v.id, v.valor])), [valoresReferencia]);
    const getComparisonClass = (produto: string, valor: number) => {
        const refValor = referenciaMap.get(produto.toLowerCase().trim());
        if (refValor === undefined) return '';
        return valor <= refValor ? 'text-green-600' : 'text-red-600';
    };

    const handleSave = async () => {
        const nome = prompt("Digite um nome para esta simulação:");
        if (nome && nome.trim()) {
            const novaSimulacaoPayload = {
                nome,
                data: new Date().toISOString(),
                itens: simulacaoItens,
            };
            try {
                const savedSimulacao = await api.post('/api/simulacoes-cotacoes', novaSimulacaoPayload);
                setSimulacoesSalvas(prev => [savedSimulacao, ...prev]);
                alert("Simulação salva com sucesso!");
            } catch (error) {
                 alert(`Erro ao salvar simulação: ${(error as Error).message}`);
            }
        }
    };

    const handleExport = (type: 'pdf' | 'excel') => {
        if (simulacaoItens.length === 0) return;
        
        const head = [['Produto', 'Marca', 'Un.', 'Qtd.', 'V. Unit.', 'V. Total', 'Origem']];
        const body = simulacaoItens.map(item => [item.produto, item.marca, item.unidade, item.quantidade, formatarMoeda(item.valorUnitario), formatarMoeda(item.valorTotal), `${item.cotacaoOrigem.local} (${new Date(item.cotacaoOrigem.data + 'T00:00:00').toLocaleDateString('pt-BR')})`]);
        
        if (type === 'pdf') {
            const doc = new jsPDF.default();
            doc.text("Simulação de Cotação", 14, 20);
            doc.autoTable({ head, body, startY: 30 });
            doc.text(`Total: ${formatarMoeda(totalSimulacao)}`, 14, doc.lastAutoTable.finalY + 10);
            doc.save(`simulacao_cotacao_${Date.now()}.pdf`);
        } else {
            const dataToExport = simulacaoItens.map(item => ({
                'Produto': item.produto, 'Marca': item.marca, 'Unidade': item.unidade, 'Quantidade': item.quantidade, 'Valor Unitário': item.valorUnitario, 'Valor Total': item.valorTotal, 'Origem Cotação': item.cotacaoOrigem.local, 'Data Cotação': item.cotacaoOrigem.data
            }));
            dataToExport.push({ 'Produto': 'TOTAL', 'Valor Total': totalSimulacao } as any);
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Simulação');
            XLSX.writeFile(wb, `simulacao_cotacao_${Date.now()}.xlsx`);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold">Itens na Simulação Atual</h3>
            <div className="border rounded-lg overflow-hidden">
                 <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-2">Produto</th><th className="px-4 py-2">Unidade</th><th className="px-4 py-2">Origem</th><th className="px-4 py-2 text-right">V. Unitário</th><th className="px-4 py-2 text-right">Qtd</th><th className="px-4 py-2 text-right">V. Total</th><th className="px-4 py-2 text-center">Ações</th></tr></thead>
                    <tbody>
                        {simulacaoItens.map((item, index) => (
                            <tr key={`${item.id}-${index}`} className="border-b">
                                <td className="px-4 py-2">{item.produto}</td>
                                <td className="px-4 py-2">{item.unidade}</td>
                                <td className="px-4 py-2 text-xs text-gray-500">{item.cotacaoOrigem.local}</td>
                                <td className={`px-4 py-2 text-right ${getComparisonClass(item.produto, item.valorUnitario)}`}>{formatarMoeda(item.valorUnitario)}</td>
                                <td className="px-4 py-2 text-right">{item.quantidade}</td>
                                <td className="px-4 py-2 text-right font-semibold">{formatarMoeda(item.valorTotal)}</td>
                                <td className="px-4 py-2 text-center"><button onClick={() => setSimulacaoItens(prev => prev.filter((_, i) => i !== index))} className="text-red-500"><TrashIcon className="w-4 h-4"/></button></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot><tr className="font-bold bg-gray-50"><td colSpan={5} className="px-4 py-2 text-right">Total:</td><td className="px-4 py-2 text-right">{formatarMoeda(totalSimulacao)}</td><td></td></tr></tfoot>
                 </table>
            </div>
            <div className="flex flex-wrap gap-2">
                <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg">Salvar Simulação</button>
                <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Exportar PDF</button>
                <button onClick={() => handleExport('excel')} className="px-4 py-2 bg-gray-600 text-white rounded-lg">Exportar Excel</button>
                <button onClick={() => setSimulacaoItens([])} className="px-4 py-2 bg-red-600 text-white rounded-lg">Limpar</button>
            </div>
        </div>
    );
};

const SimulacoesSalvasView: React.FC<{
    simulacoesSalvas: SimulacaoCotacaoSalva[],
    setSimulacoesSalvas: React.Dispatch<React.SetStateAction<SimulacaoCotacaoSalva[]>>,
    setSimulacaoItens: React.Dispatch<React.SetStateAction<SimulacaoCotacaoItem[]>>,
    setActiveTab: (tab: string) => void
}> = ({simulacoesSalvas, setSimulacoesSalvas, setSimulacaoItens, setActiveTab}) => {

    const handleRestore = (simulacao: SimulacaoCotacaoSalva) => {
        setSimulacaoItens(simulacao.itens);
        setActiveTab('simulacao');
        alert(`Simulação '${simulacao.nome}' restaurada.`);
    };
    
    const handleDelete = async (id: string) => {
        if(window.confirm('Deseja excluir esta simulação salva?')) {
            try {
                await api.delete(`/api/simulacoes-cotacoes/${id}`);
                setSimulacoesSalvas(prev => prev.filter(s => s.id !== id));
            } catch (error) {
                 alert(`Erro ao excluir simulação: ${(error as Error).message}`);
            }
        }
    };

    return (
        <div className="space-y-4">
             <h3 className="text-xl font-semibold">Simulações de Cotação Salvas</h3>
             <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-2">Nome</th><th className="px-4 py-2">Data</th><th className="px-4 py-2 text-right">Valor Total</th><th className="px-4 py-2 text-center">Ações</th></tr></thead>
                    <tbody>
                        {simulacoesSalvas.map(sim => (
                            <tr key={sim.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium">{sim.nome}</td>
                                <td className="px-4 py-2">{new Date(sim.data).toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-2 text-right">{formatarMoeda(sim.itens.reduce((acc, item) => acc + item.valorTotal, 0))}</td>
                                <td className="px-4 py-2 text-center space-x-2">
                                    <button onClick={() => handleRestore(sim)} className="text-blue-600">Restaurar</button>
                                    <button onClick={() => handleDelete(sim.id)} className="text-red-600">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

const ValoresReferenciaView: React.FC<{
    valoresReferencia: ValorReferencia[],
    setValoresReferencia: React.Dispatch<React.SetStateAction<ValorReferencia[]>>,
}> = ({ valoresReferencia, setValoresReferencia }) => {
    const [form, setForm] = useState({ produto: '', valor: '' });
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const valor = parseFloat(form.valor);
        const produto = form.produto.trim();
        if (!produto || isNaN(valor)) {
            alert("Preencha o nome do produto e um valor válido.");
            return;
        }

        const id = editingId || produto.toLowerCase().trim();
        
        try {
            await api.post('/api/valores-referencia', { id, produto, valor });
            const updatedValores = await api.get('/api/valores-referencia');
            setValoresReferencia(updatedValores);
        } catch (error) {
            alert(`Erro ao salvar valor de referência: ${(error as Error).message}`);
        }

        setForm({ produto: '', valor: '' });
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Deseja excluir este valor de referência?')) {
            try {
                await api.delete(`/api/valores-referencia/${id}`);
                setValoresReferencia(prev => prev.filter(v => v.id !== id));
            } catch (error) {
                alert(`Erro ao excluir: ${(error as Error).message}`);
            }
        }
    };
    
    const handleEdit = (ref: ValorReferencia) => {
        setEditingId(ref.id);
        setForm({ produto: ref.produto, valor: ref.valor.toString() });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm({ produto: '', valor: '' });
    };

    return (
        <div className="space-y-4">
             <h3 className="text-xl font-semibold">Gerenciar Valores de Referência</h3>
             <form onSubmit={handleSubmit} className="p-4 bg-light rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <input type="text" placeholder="Nome do Produto" value={form.produto} onChange={e => setForm({...form, produto: e.target.value})} className="border-gray-300 rounded-md" required disabled={!!editingId} title={editingId ? "Não é possível alterar o nome, apenas o valor. Exclua e crie um novo para renomear." : ""}/>
                <input type="number" step="0.01" placeholder="Valor (R$)" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} className="border-gray-300 rounded-md" required/>
                <div className="flex gap-2">
                    <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg">{editingId ? 'Salvar' : 'Adicionar'}</button>
                    {editingId && <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>}
                </div>
             </form>
             <div className="border rounded-lg overflow-hidden">
                 <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-2">Produto</th><th className="px-4 py-2 text-right">Valor de Referência</th><th className="px-4 py-2 text-center">Ações</th></tr></thead>
                    <tbody>
                        {valoresReferencia.map(ref => (
                            <tr key={ref.id} className="border-b">
                                <td className="px-4 py-2">{ref.produto}</td>
                                <td className="px-4 py-2 text-right font-semibold">{formatarMoeda(ref.valor)}</td>
                                <td className="px-4 py-2 text-center space-x-2">
                                    <button onClick={() => handleEdit(ref)} className="p-1 text-blue-600"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(ref.id)} className="p-1 text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
        </div>
    );
};


export default Cotacoes;
