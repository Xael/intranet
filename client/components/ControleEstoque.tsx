import React, { useState, useRef, FormEvent, useMemo } from 'react';
import { InventoryItem, OutputItem } from '../types';
import { api } from '../utils/api';

declare var XLSX: any;

interface ControleEstoqueProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  outputs: OutputItem[];
  setOutputs: React.Dispatch<React.SetStateAction<OutputItem[]>>;
}

const ControleEstoque: React.FC<ControleEstoqueProps> = ({ inventory, setInventory, outputs, setOutputs }) => {
  const importStockRef = useRef<HTMLInputElement>(null);
  const importOutRef = useRef<HTMLInputElement>(null);

  const [stockForm, setStockForm] = useState({ name: '', qty: '' });
  const [outputForm, setOutputForm] = useState({ date: '', product: '', qty: '', size: '', employee: '', responsible: '' });

  // --- LÓGICA DE CÁLCULO DE ESTOQUE ---
  const inventoryCalculado = useMemo(() => {
    const outputsPorItem = new Map<string, number>();
    outputs.forEach(output => {
      const key = output.product.toLowerCase();
      outputsPorItem.set(key, (outputsPorItem.get(key) || 0) + output.qty);
    });

    return inventory.map(item => {
      const outQty = item.manualOut ? item.outQty : (outputsPorItem.get(item.name.toLowerCase()) || 0);
      const remaining = item.qty - outQty;
      return { ...item, outQty, remaining };
    });
  }, [inventory, outputs]);

  // --- OTIMIZAÇÃO: Saídas ordenadas ---
  const outputsOrdenados = useMemo(() => {
    return [...outputs].sort((a, b) => {
      // Converte 'DD/MM/YYYY' para um formato comparável
      const dataA = new Date(a.date.split('/').reverse().join('-')).getTime();
      const dataB = new Date(b.date.split('/').reverse().join('-')).getTime();
      return dataB - dataA; // Ordena do mais novo para o mais antigo
    });
  }, [outputs]);

  // --- HANDLERS ---
  const handleAddStock = async (e: FormEvent) => {
    e.preventDefault();
    const name = stockForm.name.trim();
    const qty = parseInt(stockForm.qty, 10);
    if (!name || isNaN(qty) || qty <= 0) {
      alert('Por favor, informe um nome e quantidade válidos.');
      return;
    }
    try {
      const savedItem = await api.post('/api/materiais', { name, qty });
      setInventory(prev => {
        const existingItemIndex = prev.findIndex(item => item.id === savedItem.id);
        if (existingItemIndex > -1) {
          return prev.map(item => (item.id === savedItem.id ? savedItem : item));
        }
        return [...prev, savedItem];
      });
      setStockForm({ name: '', qty: '' });
    } catch (error) {
      alert(`Falha ao salvar estoque: ${(error as Error).message}`);
    }
  };

  const handleAddOutput = async (e: FormEvent) => {
    e.preventDefault();
    const { date, product, qty, size, employee, responsible } = outputForm;
    const numQty = parseInt(qty, 10);
    if (
      !date ||
      !product.trim() ||
      isNaN(numQty) ||
      numQty <= 0 ||
      !size.trim() ||
      !employee.trim() ||
      !responsible.trim()
    ) {
      alert('Por favor, preencha todos os campos de saída.');
      return;
    }
    const [y, m, d] = date.split('-');
    const formattedDate = `${d}/${m}/${y}`; // salva como DD/MM/YYYY

    const newOutputDTO = {
      date: formattedDate,
      product: product.trim(),
      qty: numQty,
      size: size.trim(),
      employee: employee.trim(),
      responsible: responsible.trim(),
    };

    try {
      const savedOutput = await api.post('/api/editais', newOutputDTO);
      setOutputs(prev => [savedOutput, ...prev]);
      setOutputForm({ date: '', product: '', qty: '', size: '', employee: '', responsible: '' });
    } catch (error) {
      alert(`Falha ao registrar saída: ${(error as Error).message}`);
    }
  };

  const handleEditStock = async (item: InventoryItem, field: 'qty' | 'outQty') => {
    const promptMessage =
      field === 'qty'
        ? `Nova quantidade inicial para '${item.name}':`
        : `Nova quantidade de saída (manual) para '${item.name}':`;
    const currentValue = field === 'qty' ? item.qty : item.outQty;
    const newValueStr = prompt(promptMessage, currentValue.toString());

    if (newValueStr !== null) {
      const newValue = parseInt(newValueStr, 10);
      if (!isNaN(newValue) && newValue >= 0) {
        const updateData = {
          ...item,
          [field]: newValue,
          manualOut: field === 'outQty' ? true : item.manualOut,
        };

        try {
          const savedItem = await api.put(`/api/materiais/${item.id}`, updateData);
          setInventory(prev => prev.map(i => (i.id === item.id ? savedItem : i)));
        } catch (error) {
          alert(`Falha ao editar item: ${(error as Error).message}`);
        }
      } else {
        alert('Por favor, insira um número válido.');
      }
    }
  };

  const handleRemoveStock = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este item do estoque?')) {
      try {
        await api.delete(`/api/materiais/${id}`);
        setInventory(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        alert(`Falha ao remover item: ${(error as Error).message}`);
      }
    }
  };

  const handleRemoveOutput = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este registro de saída?')) {
      try {
        await api.delete(`/api/editais/${id}`);
        setOutputs(prev => prev.filter(o => o.id !== id));
      } catch (error) {
        alert(`Falha ao remover saída: ${(error as Error).message}`);
      }
    }
  };

  const handleClear = async (type: 'stock' | 'outputs') => {
    if (type === 'stock' && window.confirm('ATENÇÃO: Isso limpará TODO o estoque. Deseja continuar?')) {
      try {
        await api.post('/api/materiais/restore', { materiais: [] });
        setInventory([]);
      } catch (error) {
        alert(`Falha ao limpar estoque: ${(error as Error).message}`);
      }
    }
    if (type === 'outputs' && window.confirm('ATENÇÃO: Isso limpará TODOS os registros de saída. Deseja continuar?')) {
      try {
        await api.post('/api/editais/restore', { editais: [] });
        setOutputs([]);
      } catch (error) {
        alert(`Falha ao limpar saídas: ${(error as Error).message}`);
      }
    }
  };

  const handleExport = (type: 'stock' | 'outputs') => {
    if (type === 'stock') {
      const data = inventoryCalculado.map(i => ({ Item: i.name, Inicial: i.qty, Saída: i.outQty, Restante: i.remaining }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
      XLSX.writeFile(wb, 'backup_estoque.xlsx');
    } else {
      const data = outputs.map(o => ({
        Data: o.date,
        Produto: o.product,
        Quantidade: o.qty,
        Tamanho: o.size,
        Funcionário: o.employee,
        'Responsável Retirada': o.responsible,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Saídas');
      XLSX.writeFile(wb, 'backup_saidas.xlsx');
    }
  };

  // --- IMPORTAÇÃO DE ARQUIVOS ---
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>, type: 'stock' | 'outputs') => {
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

        if (type === 'stock') {
          // Mapeia linhas para InventoryItem completo (IDs temporários locais)
          const newInventoryItems: InventoryItem[] = json
            .map((row, index) => {
              const initialQty = Number(row['Inicial'] ?? 0);
              const name = String(row['Item'] ?? '').trim();
              return {
                id: `import-${Date.now()}-${index}`,
                name,
                qty: initialQty,
                manualOut: false,
                outQty: 0,
                remaining: initialQty,
              } as InventoryItem;
            })
            .filter(item => item.name && item.qty > 0);

          // DTO para persistir no servidor
          const newInventoryDTO = newInventoryItems.map(item => ({ name: item.name, qty: item.qty }));

          if (window.confirm(`${newInventoryItems.length} itens de estoque válidos encontrados. Deseja substituir o estoque atual?`)) {
            await api.post('/api/materiais/restore', { materiais: newInventoryDTO });
            setInventory(newInventoryItems);
            alert('Estoque importado e salvo com sucesso!');
          }
        } else {
          // Mapeia linhas para OutputItem completo (IDs temporários locais)
          const newOutputItems: OutputItem[] = json
            .map((row, index) => ({
              id: `import-${Date.now()}-${index}`,
              date: String(row['Data'] ?? ''),
              product: String(row['Produto'] ?? ''),
              qty: Number(row['Quantidade'] ?? 0),
              size: String(row['Tamanho'] ?? ''),
              employee: String(row['Funcionário'] ?? ''),
              responsible: String(row['Responsável Retirada'] ?? ''),
            }))
            .filter(item => item.product && item.qty > 0 && item.date);

          // DTO para persistir no servidor
          const newOutputsDTO = newOutputItems.map(({ id, ...rest }) => rest);

          if (window.confirm(`${newOutputItems.length} registros de saída válidos encontrados. Deseja substituir as saídas atuais?`)) {
            await api.post('/api/editais/restore', { editais: newOutputsDTO });
            setOutputs(newOutputItems);
            alert('Saídas importadas e salvas com sucesso!');
          }
        }
      } catch (error) {
        console.error('Erro ao importar arquivo:', error);
        alert(`Ocorreu um erro ao importar o arquivo: ${(error as Error).message}`);
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Estoque Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Estoque</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => handleExport('stock')} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Exportar Estoque</button>
          <button onClick={() => importStockRef.current?.click()} className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700">Importar Estoque</button>
          <input type="file" ref={importStockRef} className="hidden" accept=".xlsx, .xls" onChange={(e) => handleFileImport(e, 'stock')} />
          <button onClick={() => handleClear('stock')} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg shadow hover:bg-red-700">Limpar Estoque</button>
        </div>
        <form onSubmit={handleAddStock} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6 p-4 bg-light rounded-md">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Nome do Item</label>
            <input type="text" value={stockForm.name} onChange={e => setStockForm({ ...stockForm, name: e.target.value })} placeholder="Ex: Luva de Raspa" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Quantidade</label>
            <input type="number" value={stockForm.qty} onChange={e => setStockForm({ ...stockForm, qty: e.target.value })} placeholder="Ex: 50" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <button type="submit" className="px-4 py-2 h-10 bg-primary text-white rounded-lg shadow hover:bg-secondary">Adicionar/Repor</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Inicial</th>
                <th className="px-6 py-3">Saída</th>
                <th className="px-6 py-3">Restante</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {inventoryCalculado.map(item => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4">{item.qty}</td>
                  <td className="px-6 py-4">
                    {item.outQty} {item.manualOut && <span className="text-xs text-orange-500">(M)</span>}
                  </td>
                  <td className="px-6 py-4 font-bold">{item.remaining}</td>
                  <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEditStock(item, 'qty')} className="font-medium text-blue-600 hover:underline">Editar Entrada</button>
                    <button onClick={() => handleEditStock(item, 'outQty')} className="font-medium text-yellow-600 hover:underline">Editar Saída</button>
                    <button onClick={() => handleRemoveStock(item.id)} className="font-medium text-red-600 hover:underline">Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saídas Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Relatório de Saídas</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => handleExport('outputs')} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Exportar Saídas</button>
          <button onClick={() => importOutRef.current?.click()} className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700">Importar Saídas</button>
          <input type="file" ref={importOutRef} className="hidden" accept=".xlsx, .xls" onChange={(e) => handleFileImport(e, 'outputs')} />
          <button onClick={() => handleClear('outputs')} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg shadow hover:bg-red-700">Limpar Saídas</button>
        </div>
        <form onSubmit={handleAddOutput} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end mb-6 p-4 bg-light rounded-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">Data</label>
            <input type="date" value={outputForm.date} onChange={e => setOutputForm({ ...outputForm, date: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Produto</label>
            <input type="text" list="inventory-items" value={outputForm.product} onChange={e => setOutputForm({ ...outputForm, product: e.target.value })} placeholder="Nome do item" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
            <datalist id="inventory-items">
              {inventory.map(i => (
                <option key={i.id} value={i.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantidade</label>
            <input type="number" value={outputForm.qty} onChange={e => setOutputForm({ ...outputForm, qty: e.target.value })} placeholder="Qtd." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tamanho</label>
            <input type="text" value={outputForm.size} onChange={e => setOutputForm({ ...outputForm, size: e.target.value })} placeholder="P, M, G, 42, etc." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Funcionário</label>
            <input type="text" value={outputForm.employee} onChange={e => setOutputForm({ ...outputForm, employee: e.target.value })} placeholder="Nome do funcionário" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Responsável Retirada</label>
            <input type="text" value={outputForm.responsible} onChange={e => setOutputForm({ ...outputForm, responsible: e.target.value })} placeholder="Quem retirou" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <div className="lg:col-span-3">
            <button type="submit" className="w-full px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary">Registrar Saída</button>
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3">Qtd</th>
                <th className="px-6 py-3">Tamanho</th>
                <th className="px-6 py-3">Funcionário</th>
                <th className="px-6 py-3">Responsável</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {outputsOrdenados.map(out => (
                <tr key={out.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{out.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{out.product}</td>
                  <td className="px-6 py-4">{out.qty}</td>
                  <td className="px-6 py-4">{out.size}</td>
                  <td className="px-6 py-4">{out.employee}</td>
                  <td className="px-6 py-4">{out.responsible}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleRemoveOutput(out.id)} className="font-medium text-red-600 hover:underline">Remover</button>
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

export default ControleEstoque;
