
import React, { useState, useRef, FormEvent } from 'react';
import { InventoryItem, OutputItem } from '../types';

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

  const handleAddStock = (e: FormEvent) => {
    e.preventDefault();
    const name = stockForm.name.trim();
    const qty = parseInt(stockForm.qty, 10);
    if (!name || isNaN(qty) || qty <= 0) {
      alert('Por favor, informe um nome e quantidade válidos.');
      return;
    }

    setInventory(prev => {
      const existingItemIndex = prev.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
      if (existingItemIndex > -1) {
        const updated = [...prev];
        updated[existingItemIndex].qty += qty;
        return updated;
      } else {
        const newItem: InventoryItem = {
          id: Date.now().toString(),
          name,
          qty,
          outQty: 0,
          remaining: qty,
          manualOut: false
        };
        return [...prev, newItem];
      }
    });
    setStockForm({ name: '', qty: '' });
  };

  const handleAddOutput = (e: FormEvent) => {
    e.preventDefault();
    const { date, product, qty, size, employee, responsible } = outputForm;
    const numQty = parseInt(qty, 10);

    if (!date || !product.trim() || isNaN(numQty) || numQty <= 0 || !size.trim() || !employee.trim() || !responsible.trim()) {
      alert('Por favor, preencha todos os campos de saída.');
      return;
    }
    const [y, m, d] = date.split('-');
    const formattedDate = `${d}/${m}/${y}`;

    const newOutput: OutputItem = {
      id: Date.now().toString(),
      date: formattedDate,
      product: product.trim(),
      qty: numQty,
      size: size.trim(),
      employee: employee.trim(),
      responsible: responsible.trim()
    };

    setOutputs(prev => [...prev, newOutput]);
    setOutputForm({ date: '', product: '', qty: '', size: '', employee: '', responsible: '' });
  };
  
  const handleEditStock = (item: InventoryItem, field: 'qty' | 'outQty') => {
      const promptMessage = field === 'qty' 
        ? `Nova quantidade inicial para '${item.name}':`
        : `Nova quantidade de saída (manual) para '${item.name}':`;
      const currentValue = field === 'qty' ? item.qty : item.outQty;
      const newValueStr = prompt(promptMessage, currentValue.toString());

      if (newValueStr !== null) {
          const newValue = parseInt(newValueStr, 10);
          if (!isNaN(newValue) && newValue >= 0) {
              setInventory(prev => prev.map(i => {
                  if (i.id === item.id) {
                      return {
                          ...i,
                          [field]: newValue,
                          manualOut: field === 'outQty' ? true : i.manualOut
                      };
                  }
                  return i;
              }));
          } else {
              alert("Por favor, insira um número válido.");
          }
      }
  };
  
  const handleRemoveStock = (id: string) => {
      if (window.confirm("Tem certeza que deseja remover este item do estoque?")) {
          setInventory(prev => prev.filter(i => i.id !== id));
      }
  };

  const handleRemoveOutput = (id: string) => {
      if (window.confirm("Tem certeza que deseja remover este registro de saída?")) {
          setOutputs(prev => prev.filter(o => o.id !== id));
      }
  };
  
  const handleClear = (type: 'stock' | 'outputs') => {
      if (type === 'stock' && window.confirm("ATENÇÃO: Isso limpará TODO o estoque. Deseja continuar?")) {
          setInventory([]);
      }
      if (type === 'outputs' && window.confirm("ATENÇÃO: Isso limpará TODOS os registros de saída. Deseja continuar?")) {
          setOutputs([]);
      }
  };

  const handleExport = (type: 'stock' | 'outputs') => {
      if (type === 'stock') {
          const data = inventory.map(i => ({ Item: i.name, Inicial: i.qty, Saída: i.outQty, Restante: i.remaining }));
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
          XLSX.writeFile(wb, 'backup_estoque.xlsx');
      } else {
          const data = outputs.map(o => ({'Data': o.date, 'Produto': o.product, 'Quantidade': o.qty, 'Tamanho': o.size, 'Funcionário': o.employee, 'Responsável Retirada': o.responsible }));
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Saídas');
          XLSX.writeFile(wb, 'backup_saidas.xlsx');
      }
  };
  
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>, type: 'stock' | 'outputs') => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = new Uint8Array(event.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const json: any[] = XLSX.utils.sheet_to_json(worksheet);

              if (type === 'stock') {
                  const newInventory: InventoryItem[] = json.map((row, index) => ({
                      id: `import-stock-${Date.now()}-${index}`,
                      name: row['Item'] || '',
                      qty: Number(row['Inicial'] || 0),
                      outQty: Number(row['Saída'] || 0),
                      remaining: Number(row['Restante'] || 0),
                      manualOut: true // Assume manual override on import
                  }));
                  setInventory(newInventory);
                  alert('Estoque importado com sucesso!');
              } else {
                  const newOutputs: OutputItem[] = json.map((row, index) => ({
                      id: `import-out-${Date.now()}-${index}`,
                      date: row['Data'] || '',
                      product: row['Produto'] || '',
                      qty: Number(row['Quantidade'] || 0),
                      size: row['Tamanho'] || '',
                      employee: row['Funcionário'] || '',
                      responsible: row['Responsável Retirada'] || ''
                  }));
                  setOutputs(newOutputs);
                  alert('Saídas importadas com sucesso!');
              }
          } catch (error) {
              console.error("Erro ao importar arquivo:", error);
              alert("Ocorreu um erro ao importar o arquivo. Verifique o formato.");
          }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = ''; // Reset input
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
                    <input type="text" value={stockForm.name} onChange={e => setStockForm({...stockForm, name: e.target.value})} placeholder="Ex: Luva de Raspa" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                </div>
                <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input type="number" value={stockForm.qty} onChange={e => setStockForm({...stockForm, qty: e.target.value})} placeholder="Ex: 50" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                </div>
                <button type="submit" className="px-4 py-2 h-10 bg-primary text-white rounded-lg shadow hover:bg-secondary">Adicionar/Repor</button>
            </form>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Item</th><th className="px-6 py-3">Inicial</th><th className="px-6 py-3">Saída</th><th className="px-6 py-3">Restante</th><th className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map(item => (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-4">{item.qty}</td>
                                <td className="px-6 py-4">{item.outQty}</td>
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
                    <input type="date" value={outputForm.date} onChange={e => setOutputForm({...outputForm, date: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Produto</label>
                    <input type="text" value={outputForm.product} onChange={e => setOutputForm({...outputForm, product: e.target.value})} placeholder="Nome do item" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input type="number" value={outputForm.qty} onChange={e => setOutputForm({...outputForm, qty: e.target.value})} placeholder="Qtd." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Tamanho</label>
                    <input type="text" value={outputForm.size} onChange={e => setOutputForm({...outputForm, size: e.target.value})} placeholder="P, M, G, 42, etc." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Funcionário</label>
                    <input type="text" value={outputForm.employee} onChange={e => setOutputForm({...outputForm, employee: e.target.value})} placeholder="Nome do funcionário" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Responsável Retirada</label>
                    <input type="text" value={outputForm.responsible} onChange={e => setOutputForm({...outputForm, responsible: e.target.value})} placeholder="Quem retirou" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                </div>
                <div className="lg:col-span-3">
                    <button type="submit" className="w-full px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary">Registrar Saída</button>
                </div>
            </form>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Data</th><th className="px-6 py-3">Produto</th><th className="px-6 py-3">Qtd</th><th className="px-6 py-3">Tamanho</th><th className="px-6 py-3">Funcionário</th><th className="px-6 py-3">Responsável</th><th className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {outputs.map(out => (
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