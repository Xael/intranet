import React, { useState, useMemo } from 'react';
import { CalculadoraSalva, FuncionarioCusto, ItemCusto, CustoAdicional, CalculadoraState } from '../types';
import { api } from '../utils/api';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

declare var jsPDF: any;
declare var XLSX: any;

const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const initialState: CalculadoraState = {
    funcionarios: [],
    operacional: [],
    veiculos: [],
    impostos: 0,
    valorLicitacao: 0
};

// Componente principal
interface CalculadoraProps {
    calculosSalvos: CalculadoraSalva[];
    setCalculosSalvos: React.Dispatch<React.SetStateAction<CalculadoraSalva[]>>;
}

const Calculadora: React.FC<CalculadoraProps> = ({ calculosSalvos, setCalculosSalvos }) => {
    const [activeTab, setActiveTab] = useState('calculo');
    const [currentState, setCurrentState] = useState<CalculadoraState>(initialState);

    const handleLoadCalculo = (calculo: CalculadoraSalva) => {
        // Garante que todos os campos do estado inicial existam no estado carregado
        const newState = { ...initialState, ...calculo.custos };
        setCurrentState(newState);
        setActiveTab('calculo');
        alert(`Cálculo "${calculo.nome}" carregado com sucesso.`);
    };

    const handleDeleteCalculo = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este cálculo salvo?")) {
            try {
                await api.delete(`/api/calculadora/${id}`);
                setCalculosSalvos(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                alert(`Erro ao excluir cálculo: ${(error as Error).message}`);
            }
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Calculadora de Custos</h1>
             <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
                <nav className="-mb-px flex space-x-2">
                    <button onClick={() => setActiveTab('calculo')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'calculo' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>
                        Cálculo Atual
                    </button>
                    <button onClick={() => setActiveTab('salvos')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'salvos' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>
                        Cálculos Salvos
                    </button>
                </nav>
            </div>
            {activeTab === 'calculo' && <CalculoAtualView state={currentState} setState={setCurrentState} setCalculosSalvos={setCalculosSalvos} />}
            {activeTab === 'salvos' && <CalculosSalvosView calculosSalvos={calculosSalvos} onLoad={handleLoadCalculo} onDelete={handleDeleteCalculo} />}
        </div>
    );
};

// View do Cálculo Atual
const CalculoAtualView: React.FC<{
    state: CalculadoraState,
    setState: React.Dispatch<React.SetStateAction<CalculadoraState>>,
    setCalculosSalvos: React.Dispatch<React.SetStateAction<CalculadoraSalva[]>>
}> = ({ state, setState, setCalculosSalvos }) => {

    const { funcionarios, operacional, veiculos, impostos, valorLicitacao } = state;
    
    // Cálculos
    const totais = useMemo(() => {
        const totalFuncionarios = funcionarios.reduce((acc, func) => 
            acc + func.salarioBase + func.custosAdicionais.reduce((subAcc, custo) => subAcc + custo.valor, 0), 0);
        const totalOperacional = operacional.reduce((acc, item) => acc + item.valor, 0);
        const totalVeiculos = veiculos.reduce((acc, item) => acc + item.valor, 0);
        const custoTotal = totalFuncionarios + totalOperacional + totalVeiculos;
        const valorImpostos = custoTotal * (impostos / 100);
        const custoTotalComImpostos = custoTotal + valorImpostos;
        const lucroPrejuizo = valorLicitacao - custoTotalComImpostos;
        const margemLucro = valorLicitacao > 0 ? (lucroPrejuizo / valorLicitacao) * 100 : 0;
        return { totalFuncionarios, totalOperacional, totalVeiculos, custoTotal, valorImpostos, custoTotalComImpostos, lucroPrejuizo, margemLucro };
    }, [funcionarios, operacional, veiculos, impostos, valorLicitacao]);

    // Handlers
    const handleSave = async () => {
        const nome = prompt("Digite um nome para este cálculo:");
        if (nome && nome.trim()) {
            try {
                const novoCalculo = await api.post('/api/calculadora', { nome, custos: state });
                setCalculosSalvos(prev => [novoCalculo, ...prev]);
                alert("Cálculo salvo com sucesso!");
            } catch (error) {
                alert(`Erro ao salvar cálculo: ${(error as Error).message}`);
            }
        }
    };

    const handleExport = (type: 'pdf' | 'excel') => {
        const commonHeader = [
            `Composição de Custos`,
            `Custo Total: ${formatarMoeda(totais.custoTotal)}`,
            `Impostos (${impostos}%): ${formatarMoeda(totais.valorImpostos)}`,
            `Custo Total com Impostos: ${formatarMoeda(totais.custoTotalComImpostos)}`,
            `Valor da Licitação: ${formatarMoeda(valorLicitacao)}`,
            `Lucro / Prejuízo: ${formatarMoeda(totais.lucroPrejuizo)} (${totais.margemLucro.toFixed(2)}%)`
        ];

        if (type === 'pdf') {
            const doc = new jsPDF.default();
            let y = 15;
            doc.setFontSize(16);
            doc.text('Composição de Custos', 14, y);
            y += 10;
            doc.setFontSize(10);
            
            // Summary
            doc.text(`Custo Total: ${formatarMoeda(totais.custoTotal)}`, 14, y); y += 6;
            doc.text(`Impostos (${impostos}%): ${formatarMoeda(totais.valorImpostos)}`, 14, y); y += 6;
            doc.text(`Custo Total com Impostos: ${formatarMoeda(totais.custoTotalComImpostos)}`, 14, y); y += 8;
            doc.text(`Valor da Licitação: ${formatarMoeda(valorLicitacao)}`, 14, y); y += 6;
            doc.text(`Lucro / Prejuízo: ${formatarMoeda(totais.lucroPrejuizo)} (${totais.margemLucro.toFixed(2)}%)`, 14, y); y += 10;
            
            // Sections
            if (funcionarios.length > 0) {
                 doc.setFontSize(12);
                 doc.text('Funcionários', 14, y); y+=2;
                 const funcBody = funcionarios.flatMap(f => [
                    [{ content: `${f.cargo} - Salário Base`, styles: { fontStyle: 'bold' } }, formatarMoeda(f.salarioBase)],
                    ...f.custosAdicionais.map(c => [c.descricao, formatarMoeda(c.valor)])
                 ]);
                 doc.autoTable({ head: [['Descrição', 'Valor']], body: funcBody, startY: y, theme: 'grid' });
                 y = doc.lastAutoTable.finalY + 10;
            }
            if (operacional.length > 0) {
                 doc.setFontSize(12);
                 doc.text('Custos Operacionais', 14, y); y+=2;
                 doc.autoTable({ head: [['Descrição', 'Valor']], body: operacional.map(i => [i.descricao, formatarMoeda(i.valor)]), startY: y, theme: 'grid' });
                 y = doc.lastAutoTable.finalY + 10;
            }
             if (veiculos.length > 0) {
                 doc.setFontSize(12);
                 doc.text('Veículos', 14, y); y+=2;
                 doc.autoTable({ head: [['Descrição', 'Valor']], body: veiculos.map(i => [i.descricao, formatarMoeda(i.valor)]), startY: y, theme: 'grid' });
            }

            doc.save(`calculo_custos_${Date.now()}.pdf`);

        } else { // Excel
            const wb = XLSX.utils.book_new();
            const ws_data: any[] = [commonHeader, []];
            
            if (funcionarios.length > 0) {
                ws_data.push(['Funcionários']);
                ws_data.push(['Cargo', 'Custo', 'Valor']);
                funcionarios.forEach(f => {
                    ws_data.push([f.cargo, 'Salário Base', f.salarioBase]);
                    f.custosAdicionais.forEach(c => ws_data.push(['', c.descricao, c.valor]));
                });
                ws_data.push([]);
            }
            if (operacional.length > 0) {
                ws_data.push(['Custos Operacionais']);
                ws_data.push(['Descrição', 'Valor']);
                operacional.forEach(i => ws_data.push([i.descricao, i.valor]));
                ws_data.push([]);
            }
            if (veiculos.length > 0) {
                 ws_data.push(['Veículos']);
                ws_data.push(['Descrição', 'Valor']);
                veiculos.forEach(i => ws_data.push([i.descricao, i.valor]));
            }

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            XLSX.utils.book_append_sheet(wb, ws, 'Cálculo de Custos');
            XLSX.writeFile(wb, `calculo_custos_${Date.now()}.xlsx`);
        }
    };
    

    return (
        <div className="space-y-4">
            {/* Painel de Resumo */}
            <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-sm text-gray-500">Custo Total</p>
                    <p className="text-xl font-bold">{formatarMoeda(totais.custoTotalComImpostos)}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500">Valor da Licitação</p>
                    <input type="number" value={valorLicitacao || ''} onChange={e => setState(s => ({...s, valorLicitacao: parseFloat(e.target.value) || 0}))} className="text-xl font-bold w-full text-center bg-gray-100 rounded-md"/>
                </div>
                 <div className={totais.lucroPrejuizo >= 0 ? 'text-green-600' : 'text-red-600'}>
                    <p className="text-sm">Lucro / Prejuízo</p>
                    <p className="text-xl font-bold">{formatarMoeda(totais.lucroPrejuizo)}</p>
                </div>
                 <div className={totais.lucroPrejuizo >= 0 ? 'text-green-600' : 'text-red-600'}>
                    <p className="text-sm">Margem</p>
                    <p className="text-xl font-bold">{totais.margemLucro.toFixed(2)}%</p>
                </div>
            </div>

            {/* Seções de Custo */}
            <div className="space-y-4">
                <Accordion title="Funcionários" total={totais.totalFuncionarios} onAdd={() => setState(s => ({...s, funcionarios: [...s.funcionarios, {id: `f-${Date.now()}`, cargo: '', salarioBase: 0, custosAdicionais: []}]}))}>
                    {funcionarios.map((func, idx) => <FuncionarioItem key={func.id} funcionario={func} setState={setState} index={idx} />)}
                </Accordion>
                <Accordion title="Custos Operacionais" total={totais.totalOperacional} onAdd={() => setState(s => ({...s, operacional: [...s.operacional, {id: `o-${Date.now()}`, descricao: '', valor: 0}]}))}>
                    {operacional.map((item, idx) => <CustoItem key={item.id} item={item} setState={setState} index={idx} type="operacional" />)}
                </Accordion>
                <Accordion title="Veículos" total={totais.totalVeiculos} onAdd={() => setState(s => ({...s, veiculos: [...s.veiculos, {id: `v-${Date.now()}`, descricao: '', valor: 0}]}))}>
                     {veiculos.map((item, idx) => <CustoItem key={item.id} item={item} setState={setState} index={idx} type="veiculos" />)}
                </Accordion>
            </div>
            
            {/* Impostos e Ações */}
            <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
                <div className="flex items-center gap-4">
                    <label className="font-semibold">Impostos (%):</label>
                    <input type="number" value={impostos || ''} onChange={e => setState(s => ({...s, impostos: parseFloat(e.target.value) || 0}))} className="w-24 p-2 border rounded-md" />
                </div>
                 <div className="flex flex-wrap gap-2">
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg">Salvar Cálculo</button>
                    <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Exportar PDF</button>
                    <button onClick={() => handleExport('excel')} className="px-4 py-2 bg-gray-600 text-white rounded-lg">Exportar Excel</button>
                    <button onClick={() => setState(initialState)} className="px-4 py-2 bg-red-600 text-white rounded-lg">Limpar Tudo</button>
                </div>
            </div>
        </div>
    );
};

// Componentes internos para a Calculadora
const Accordion: React.FC<{ title: string; total: number; onAdd: () => void; children: React.ReactNode }> = ({ title, total, onAdd, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="bg-white rounded-lg shadow-md">
            <div onClick={() => setIsOpen(!isOpen)} className="p-4 flex justify-between items-center cursor-pointer">
                <h3 className="text-lg font-semibold">{title}</h3>
                <div className="flex items-center gap-4">
                    <span className="font-bold">{formatarMoeda(total)}</span>
                    <button onClick={(e) => { e.stopPropagation(); onAdd(); setIsOpen(true); }} className="p-1 text-primary hover:bg-light rounded-full"><PlusIcon className="w-5 h-5"/></button>
                </div>
            </div>
            {isOpen && <div className="p-4 border-t space-y-3">{children}</div>}
        </div>
    );
};

const FuncionarioItem: React.FC<{ funcionario: FuncionarioCusto, setState: React.Dispatch<React.SetStateAction<CalculadoraState>>, index: number }> = ({ funcionario, setState, index }) => {
    const updateFunc = (field: keyof FuncionarioCusto, value: any) => {
        setState(s => ({...s, funcionarios: s.funcionarios.map((f, i) => i === index ? {...f, [field]: value} : f)}));
    };
    const updateAdicional = (adicionalIndex: number, field: keyof CustoAdicional, value: any) => {
        const updatedAdicionais = funcionario.custosAdicionais.map((c, i) => i === adicionalIndex ? {...c, [field]: value} : c);
        updateFunc('custosAdicionais', updatedAdicionais);
    };

    return (
        <div className="p-3 bg-light border rounded-lg space-y-2">
            <div className="flex gap-2 items-center">
                <input type="text" value={funcionario.cargo} onChange={e => updateFunc('cargo', e.target.value)} placeholder="Cargo" className="flex-1 p-1 border rounded-md"/>
                <input type="number" value={funcionario.salarioBase || ''} onChange={e => updateFunc('salarioBase', parseFloat(e.target.value) || 0)} placeholder="Salário Base" className="w-32 p-1 border rounded-md"/>
                <button onClick={() => setState(s => ({...s, funcionarios: s.funcionarios.filter(f => f.id !== funcionario.id)}))} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
            </div>
            <div className="pl-4 space-y-1">
                {funcionario.custosAdicionais.map((custo, i) => (
                     <div key={custo.id} className="flex gap-2 items-center">
                        <input type="text" value={custo.descricao} onChange={e => updateAdicional(i, 'descricao', e.target.value)} placeholder="Custo adicional" className="flex-1 p-1 border rounded-md text-sm"/>
                        <input type="number" value={custo.valor || ''} onChange={e => updateAdicional(i, 'valor', parseFloat(e.target.value) || 0)} placeholder="Valor" className="w-32 p-1 border rounded-md text-sm"/>
                        <button onClick={() => updateFunc('custosAdicionais', funcionario.custosAdicionais.filter(c => c.id !== custo.id))} className="text-red-500"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
                <button onClick={() => updateFunc('custosAdicionais', [...funcionario.custosAdicionais, {id: `ca-${Date.now()}`, descricao: '', valor: 0}])} className="text-xs text-blue-600">+ Custo Adicional</button>
            </div>
        </div>
    );
};

const CustoItem: React.FC<{ item: ItemCusto, setState: React.Dispatch<React.SetStateAction<CalculadoraState>>, index: number, type: 'operacional' | 'veiculos' }> = ({ item, setState, index, type }) => {
    const updateItem = (field: keyof ItemCusto, value: any) => {
        setState(s => ({...s, [type]: s[type].map((it, i) => i === index ? {...it, [field]: value} : it)}));
    };
    return (
        <div className="flex gap-2 items-center">
            <input type="text" value={item.descricao} onChange={e => updateItem('descricao', e.target.value)} placeholder="Descrição do custo" className="flex-1 p-1 border rounded-md"/>
            <input type="number" value={item.valor || ''} onChange={e => updateItem('valor', parseFloat(e.target.value) || 0)} placeholder="Valor" className="w-32 p-1 border rounded-md"/>
            <button onClick={() => setState(s => ({...s, [type]: s[type].filter(it => it.id !== item.id)}))} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
        </div>
    );
};


// View de Cálculos Salvos
const CalculosSalvosView: React.FC<{
    calculosSalvos: CalculadoraSalva[];
    onLoad: (calculo: CalculadoraSalva) => void;
    onDelete: (id: string) => void;
}> = ({ calculosSalvos, onLoad, onDelete }) => {
    return (
         <div className="space-y-4">
             <h3 className="text-xl font-semibold">Cálculos Salvos</h3>
             <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Nome</th>
                            <th className="px-4 py-2 text-left">Data</th>
                            <th className="px-4 py-2 text-right">Custo Total</th>
                            <th className="px-4 py-2 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calculosSalvos.map(calc => {
                            const total = (calc.custos.funcionarios.reduce((acc, f) => acc + f.salarioBase + f.custosAdicionais.reduce((s, c) => s + c.valor, 0), 0))
                                + (calc.custos.operacional.reduce((acc, i) => acc + i.valor, 0))
                                + (calc.custos.veiculos.reduce((acc, i) => acc + i.valor, 0));
                            const totalComImpostos = total * (1 + (calc.custos.impostos || 0) / 100);

                            return (
                                <tr key={calc.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{calc.nome}</td>
                                    <td className="px-4 py-2">{new Date(calc.data).toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-2 text-right">{formatarMoeda(totalComImpostos)}</td>
                                    <td className="px-4 py-2 text-center space-x-2">
                                        <button onClick={() => onLoad(calc)} className="text-blue-600">Carregar</button>
                                        <button onClick={() => onDelete(calc.id)} className="text-red-600">Excluir</button>
                                    </td>
                                </tr>
                            );
                        })}
                         {calculosSalvos.length === 0 && (<tr><td colSpan={4} className="text-center py-4 text-gray-500">Nenhum cálculo salvo.</td></tr>)}
                    </tbody>
                </table>
             </div>
        </div>
    );
};


export default Calculadora;
