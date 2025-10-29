import React, { useState, useRef, FormEvent, useMemo } from 'react';
import { EPIEntrega, EPIEstoqueItem } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { api } from '../utils/api'; // Import da API

declare var XLSX: any;

interface EPIEstoqueItemComCalculo extends EPIEstoqueItem {
    outQty: number;
    remaining: number;
}

interface ControleEPIProps {
  entregas: EPIEntrega[];
  setEntregas: React.Dispatch<React.SetStateAction<EPIEntrega[]>>;
  estoque: EPIEstoqueItem[];
  setEstoque: React.Dispatch<React.SetStateAction<EPIEstoqueItem[]>>;
}

const ControleEPI: React.FC<ControleEPIProps> = ({ entregas, setEntregas, estoque, setEstoque }) => {
  const [showEntregaForm, setShowEntregaForm] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [newEntrega, setNewEntrega] = useState({ funcionario: '', item: '', quantidade: '1', dataEntrega: today });
  const [newEstoque, setNewEstoque] = useState({ name: '', qty: '' });
  
  const importEntregasRef = useRef<HTMLInputElement>(null);
  const importEstoqueRef = useRef<HTMLInputElement>(null);

  // --- LÓGICA DE CÁLCULO DE ESTOQUE ---
  const estoqueCalculado: EPIEstoqueItemComCalculo[] = useMemo(() => {
    const entregasPorItem = new Map<string, number>();
    entregas.forEach(entrega => {
        const key = entrega.item.toLowerCase();
        entregasPorItem.set(key, (entregasPorItem.get(key) || 0) + entrega.quantidade);
    });

    return estoque.map(item => {
        const outQty = item.manualOut ? item.manualOutQty : (entregasPorItem.get(item.name.toLowerCase()) || 0);
        const remaining = item.qty - outQty;
        return { ...item, outQty, remaining };
    });
  }, [estoque, entregas]);


  // --- HANDLERS DE ESTOQUE ---
  const handleAddEstoque = async (e: FormEvent) => { 
    e.preventDefault();
    const name = newEstoque.name.trim();
    const qty = parseInt(newEstoque.qty, 10);
    if (!name || isNaN(qty) || qty <= 0) return alert('Informe nome e quantidade válidos.');

    try {
        const savedItem = await api.post('/api/epi-estoque', { name, qty });

        setEstoque(prev => {
            const idx = prev.findIndex(i => i.id === savedItem.id);
            if (idx > -1) {
                return prev.map(item => item.id === savedItem.id ? savedItem : item);
            }
            return [...prev, savedItem];
        });

        setNewEstoque({ name: '', qty: '' });
    } catch (error) {
        alert(`Falha ao salvar item no estoque: ${(error as Error).message}`);
    }
  };

  const handleEditEstoque = async (item: EPIEstoqueItem, field: 'qty' | 'manualOutQty') => {
      const promptMsg = field === 'qty' ? `Nova quantidade INICIAL para '${item.name}':` : `Nova quantidade de SAÍDA (manual) para '${item.name}':`;
      const currentVal = field === 'qty' ? item.qty : item.manualOutQty;
      const newValStr = prompt(promptMsg, currentVal.toString());

      if (newValStr !== null) {
          const newVal = parseInt(newValStr, 10);
          if (!isNaN(newVal) && newVal >= 0) {
              const updateData = {
                ...item,
                [field]: newVal,
                manualOut: field === 'manualOutQty' ? true : item.manualOut
              };
              
              try {
                const savedItem = await api.put(`/api/epi-estoque/${item.id}`, updateData);
                setEstoque(prev => prev.map(i => i.id === item.id ? savedItem : i));
              } catch (error) {
                alert(`Falha ao editar item: ${(error as Error).message}`);
              }
          } else {
              alert("Valor inválido.");
          }
      }
  };

  const handleRemoveEstoque = async (id: string) => { 
    if(window.confirm("Remover este item do estoque?")) {
        try {
            await api.delete(`/api/epi-estoque/${id}`); 
            setEstoque(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            alert(`Falha ao remover item: ${(error as Error).message}`);
        }
      }
  };

  const handleClearEstoque = async () => {
    if (window.confirm("ATENÇÃO: Isso limpará TODO o estoque de EPI. Deseja continuar?")) {
      try {
        await api.post('/api/epi-estoque/restore', { estoque: [] });
        setEstoque([]);
      } catch (error) {
        alert(`Falha ao limpar o estoque: ${(error as Error).message}`);
      }
    }
  };


  // --- HANDLERS DE ENTREGAS ---
  const handleAddEntrega = async (e: FormEvent) => {
    e.preventDefault();
    const quantidadeNum = parseInt(newEntrega.quantidade, 10);
    if (!newEntrega.funcionario.trim() || !newEntrega.item.trim() || isNaN(quantidadeNum) || quantidadeNum <= 0) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }

    const newEntryDTO = {
      funcionario: newEntrega.funcionario.trim(),
      item: newEntrega.item.trim(),
      quantidade: quantidadeNum,
      dataEntrega: newEntrega.dataEntrega,
    };

    try {
      const savedEntry = await api.post('/api/epi', newEntryDTO);
      
      setEntregas(prev => [savedEntry, ...prev].sort((a,b) => new Date(b.dataEntrega).getTime() - new Date(a.dataEntrega).getTime()));
      setNewEntrega({ funcionario: '', item: '', quantidade: '1', dataEntrega: today });
      setShowEntregaForm(false);
    } catch (error) {
      alert(`Falha ao salvar entrega: ${(error as Error).message}`);
    }
  };
  
  const handleRemoveEntrega = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este registro de entrega?")) {
      try {
        await api.delete(`/api/epi/${id}`);
        setEntregas(prev => prev.filter(e => e.id !== id));
      } catch (error) {
        alert(`Falha ao remover entrega: ${(error as Error).message}`);
      }
    }
  };

  const handleClearEntregas = async () => {
    if (window.confirm("ATENÇÃO: Isso limpará TODOS os registros de entrega de EPI. Deseja continuar?")) {
      try {
        await api.post('/api/epi/restore', { entregas: [] });
        setEntregas([]);
      } catch (error) {
        alert(`Falha ao limpar entregas: ${(error as Error).message}`);
      }
    }
  };

  // --- IMPORTAÇÃO / EXPORTAÇÃO ---
  const handleExport = (type: 'estoque' | 'entregas') => {
    if (type === 'estoque') {
        if(estoque.length === 0) return alert('Não há dados de estoque para exportar.');
        const data = estoque.map(i => ({ 'Item': i.name, 'Quantidade Inicial': i.qty, 'Saída Manual': i.manualOut ? i.manualOutQty : 'Automático' }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Estoque EPI');
        XLSX.writeFile(wb, `estoque_epi_${today}.xlsx`);
    } else {
        if(entregas.length === 0) return alert('Não há dados de entregas para exportar.');
        const data = entregas.map(e => ({ 'Funcionário': e.funcionario, 'Item (EPI)': e.item, 'Quantidade': e.quantidade, 'Data da Entrega': e.dataEntrega }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Entregas EPI');
        XLSX.writeFile(wb, `entregas_epi_${today}.xlsx`);
    }
  };

  const handleImportEntregas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (json.length === 0) throw new Error("Planilha vazia.");

            const headers = Object.keys(json[0]);
            const isOldFormat = headers.includes('Produto') && headers.includes('Responsável Retirada');
            const isNewFormat = headers.includes('Item (EPI)');

            if (!isOldFormat && !isNewFormat) throw new Error("Formato de planilha não reconhecido. Verifique os cabeçalhos.");
            
            {/* LINHA CORRIGIDA ABAIXO (removido o 'index') */}
            const newEntregasDTO = json.map((row) => {
                const item = row[isOldFormat ? 'Produto' : 'Item (EPI)'];
                const dataEntrega = row[isOldFormat ? 'Data' : 'Data da Entrega'];
                let formattedDate = today;
                if (dataEntrega instanceof Date) {
                    formattedDate = new Date(dataEntrega.getTime() - (dataEntrega.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                }

                return {
                    funcionario: String(row['Funcionário'] || ''),
                    item: String(item || ''),
                    quantidade: parseInt(row['Quantidade'], 10) || 0,
                    dataEntrega: formattedDate,
                }
            }).filter(e => e.funcionario && e.item && e.quantidade > 0);
            
            if(window.confirm(`${newEntregasDTO.length} registros válidos encontrados. Deseja substituir os registros de entrega atuais?`)){
                const savedEntregas = await api.post('/api/epi/restore', { entregas: newEntregasDTO });
                setEntregas(savedEntregas.sort((a:EPIEntrega, b:EPIEntrega) => new Date(b.dataEntrega).getTime() - new Date(a.dataEntrega).getTime()));
                alert("Entregas importadas e salvas com sucesso!");
            }
        } catch (error) {
            alert(`Erro ao importar: ${(error as Error).message}`);
        } finally {
            if(importEntregasRef.current) importEntregasRef.current.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleImportEstoque = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = async (event) => {
        try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);
            
          {/* Esta função estava correta, pois usa o 'index' na msg de erro */}
            const newEstoqueDTO = json.map((row, index) => { 
                const name = row['Item'];
                const qty = parseInt(row['Quantidade Inicial'], 10);
                if (!name || isNaN(qty)) throw new Error(`Linha ${index+2} inválida.`);
                return { name, qty };
            });

            if(window.confirm(`${newEstoqueDTO.length} itens de estoque encontrados. Deseja substituir o estoque atual?`)) {
                const savedEstoque = await api.post('/api/epi-estoque/restore', { estoque: newEstoqueDTO });
                setEstoque(savedEstoque);
                alert('Estoque importado e salvo com sucesso!');
            }
        } catch(error) {
            alert(`Erro ao importar estoque: ${(error as Error).message}. A planilha deve conter as colunas 'Item' e 'Quantidade Inicial'.`);
        } finally {
            if(importEstoqueRef.current) importEstoqueRef.current.value = '';
        }
     };
     reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Controle de Estoque de EPIs</h1>

      {/* Seção de Estoque */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Estoque de EPI</h2>
        <div className="flex flex-wrap gap-2 items-start">
            <div>
              <button onClick={() => handleExport('estoque')} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">Exportar</button>
            </div>
            <div>
                <button onClick={() => importEstoqueRef.current?.click()} className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md">Importar</button>
              <p className="text-xs text-gray-500 mt-1">Planilha com colunas: 'Item', 'Quantidade Inicial'.</p>
              <input type="file" ref={importEstoqueRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportEstoque} />
            </div>
            <div>
              <button onClick={handleClearEstoque} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md">Limpar Estoque</button>
            </div>
        </div>
        <form onSubmit={handleAddEstoque} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end p-4 bg-light rounded-md">
            <input type="text" value={newEstoque.name} onChange={e => setNewEstoque({...newEstoque, name: e.target.value})} placeholder="Nome do Item" className="sm:col-span-1 border-gray-300 rounded-md" required />
            <input type="number" value={newEstoque.qty} onChange={e => setNewEstoque({...newEstoque, qty: e.target.value})} placeholder="Quantidade" className="sm:col-span-1 border-gray-300 rounded-md" required />
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary">Adicionar/Repor</button>
        </form>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-center">Qtd. Inicial</th>
                <th className="px-4 py-3 text-center">Saídas</th>
                <th className="px-4 py-3 text-center font-bold">Restante</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {estoqueCalculado.map(item => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2 text-center">{item.qty}</td>
                  <td className="px-4 py-2 text-center">{item.outQty} {item.manualOut && <span className="text-xs text-orange-500">(M)</span>}</td>
                  <td className="px-4 py-2 text-center font-bold text-lg">{item.remaining}</td>
                  <td className="px-4 py-2 text-center space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEditEstoque(item, 'qty')} className="p-1 text-blue-600" title="Editar Qtd. Inicial"><EditIcon className="w-4 h-4"/></button>
                    <button onClick={() => handleEditEstoque(item, 'manualOutQty')} className="p-1 text-yellow-600" title="Editar Saída Manualmente"><EditIcon className="w-4 h-4"/></button>
                    <button onClick={() => handleRemoveEstoque(item.id)} className="p-1 text-red-600" title="Remover Item"><TrashIcon className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Seção de Entregas */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Relatório de Entregas (Saídas)</h2>
            <div className="flex items-start gap-2">
                <button onClick={() => handleExport('entregas')} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">Exportar</button>
                <div>
                  <button onClick={() => importEntregasRef.current?.click()} className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md">Importar</button>
                  <p className="text-xs text-gray-500 mt-1">Colunas: 'Funcionário', 'Item (EPI)', 'Quantidade', 'Data da Entrega'.</p>
                  <input type="file" ref={importEntregasRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportEntregas} />
                </div>
                <button onClick={handleClearEntregas} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md">Limpar</button>
                <button onClick={() => setShowEntregaForm(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary">
                  <PlusIcon className="w-5 h-5 mr-2" /> Nova Entrega
                  </button>
            </div>
        </div>
        {showEntregaForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={() => setShowEntregaForm(false)}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                    <form onSubmit={handleAddEntrega} className="space-y-4">
                        <div className="p-6 border-b"><h3 className="text-xl font-bold">Registrar Nova Entrega</h3></div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2"><label>Funcionário</label><input type="text" name="funcionario" value={newEntrega.funcionario} onChange={e => setNewEntrega(prev => ({ ...prev, funcionario: e.target.value }))} required className="w-full mt-1 border-gray-300 rounded-md"/></div>
                          <div className="md:col-span-2"><label>Item (EPI)</label>
                            <input list="epi-items" name="item" value={newEntrega.item} onChange={e => setNewEntrega(prev => ({ ...prev, item: e.target.value }))} required className="w-full mt-1 border-gray-300 rounded-md"/>
                            <datalist id="epi-items">
                                {estoque.map(i => <option key={i.id} value={i.name}/>)}
                            </datalist>
                          </div>
                          <div><label>Quantidade</label><input type="number" name="quantidade" value={newEntrega.quantidade} onChange={e => setNewEntrega(prev => ({ ...prev, quantidade: e.target.value }))} required min="1" className="w-full mt-1 border-gray-300 rounded-md"/></div>
                          <div><label>Data da Entrega</label><input type="date" name="dataEntrega" value={newEntrega.dataEntrega} onChange={e => setNewEntrega(prev => ({ ...prev, dataEntrega: e.target.value }))} required className="w-full mt-1 border-gray-300 rounded-md"/></div>
                        </div>
                      <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowEntregaForm(false)}>Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
                <th className="px-6 py-3">Funcionário</th><th className="px-6 py-3">Item (EPI)</th>
                <th className="px-6 py-3 text-center">Qtd.</th><th className="px-6 py-3">Data</th><th className="px-6 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {entregas.map(item => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">{item.funcionario}</td>
                  <td className="px-6 py-4">{item.item}</td>
                  <td className="px-6 py-4 text-center">{item.quantidade}</td>
                  <td className="px-6 py-4">{new Date(item.dataEntrega + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleRemoveEntrega(item.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5 inline-block" /></button>
                 </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ControleEPI;
