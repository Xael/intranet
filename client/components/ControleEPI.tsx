import React, { useState, useRef, FormEvent } from 'react';
import { EPIEntrega } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { api } from '../utils/api';

declare var XLSX: any;

interface ControleEPIProps {
  entregas: EPIEntrega[];
  setEntregas: React.Dispatch<React.SetStateAction<EPIEntrega[]>>;
}

const ControleEPI: React.FC<ControleEPIProps> = ({ entregas, setEntregas }) => {
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [newEntrega, setNewEntrega] = useState({
    funcionario: '',
    item: '',
    quantidade: '1',
    dataEntrega: today
  });
  const importRef = useRef<HTMLInputElement>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEntrega(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEntrega = async (e: FormEvent) => {
    e.preventDefault();
    const quantidadeNum = parseInt(newEntrega.quantidade, 10);
    if (!newEntrega.funcionario.trim() || !newEntrega.item.trim() || isNaN(quantidadeNum) || quantidadeNum <= 0) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }

    const newEntry: Omit<EPIEntrega, 'id'> = {
      funcionario: newEntrega.funcionario.trim(),
      item: newEntrega.item.trim(),
      quantidade: quantidadeNum,
      dataEntrega: newEntrega.dataEntrega,
    };

    try {
        const savedEntrega = await api.post('/epi', newEntry);
        setEntregas(prev => [savedEntrega, ...prev].sort((a,b) => new Date(b.dataEntrega).getTime() - new Date(a.dataEntrega).getTime()));
        setNewEntrega({ funcionario: '', item: '', quantidade: '1', dataEntrega: today });
        setShowForm(false);
    } catch(error) {
        alert(`Falha ao registrar entrega: ${(error as Error).message}`);
    }
  };

  const handleRemoveEntrega = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este registro de entrega?")) {
      try {
        await api.delete(`/epi/${id}`);
        setEntregas(prev => prev.filter(e => e.id !== id));
      } catch (error) {
        alert(`Falha ao remover entrega: ${(error as Error).message}`);
      }
    }
  };

  // Funções de backup/restore e exportar/importar permanecem locais por enquanto.
  const handleClear = () => {
    if (window.confirm("ATENÇÃO: Isso limpará TODOS os registros de entrega de EPI. Deseja continuar?")) {
      // TODO: Implementar chamada de API para limpar todos os EPIs se necessário
      setEntregas([]);
    }
  };

  const handleExport = () => {
    if (entregas.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }
    const dataToExport = entregas.map(e => ({
      'Funcionário': e.funcionario,
      'Item (EPI)': e.item,
      'Quantidade': e.quantidade,
      'Data da Entrega': e.dataEntrega,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entregas de EPI');
    XLSX.writeFile(wb, `backup_entregas_epi_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates:true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const newEntregas: EPIEntrega[] = json.map((row, index) => {
          const func = row['Funcionário'];
          const item = row['Item (EPI)'];
          const qtd = row['Quantidade'];
          const data = row['Data da Entrega'];

          if(!func || !item || isNaN(parseInt(qtd, 10))) {
              throw new Error(`Linha ${index + 2} do arquivo está inválida.`);
          }
          
          let formattedDate = today;
          if (data instanceof Date) {
            formattedDate = data.toISOString().split('T')[0];
          } else if (typeof data === 'string') {
              const parsedDate = new Date(data);
              if(!isNaN(parsedDate.getTime())){
                  formattedDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
              }
          }

          return {
            id: `import-${Date.now()}-${index}`,
            funcionario: String(func),
            item: String(item),
            quantidade: parseInt(qtd, 10),
            dataEntrega: formattedDate,
          }
        });
        
        if (window.confirm(`Foram encontrados ${newEntregas.length} registros. Deseja substituir os dados atuais por estes?`)) {
            // TODO: Implementar chamada de API para importação em massa
            setEntregas(newEntregas.sort((a,b) => new Date(b.dataEntrega).getTime() - new Date(a.dataEntrega).getTime()));
            alert('Dados de EPI importados com sucesso!');
        }

      } catch (error) {
        console.error("Erro ao importar arquivo:", error);
        alert(`Ocorreu um erro ao importar o arquivo: ${(error as Error).message}`);
      } finally {
        if(importRef.current) importRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Controle de Entrega de EPIs</h2>
        <div className="flex items-center gap-2">
            <button onClick={handleExport} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Exportar</button>
            <button onClick={() => importRef.current?.click()} className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700">Importar</button>
            <input type="file" ref={importRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileImport} />
            <button onClick={handleClear} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg shadow hover:bg-red-700">Limpar Tudo</button>
            <button onClick={() => setShowForm(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary transition-colors">
              <PlusIcon className="w-5 h-5 mr-2" />
              Nova Entrega
            </button>
        </div>
      </div>
      
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleAddEntrega}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-800">Registrar Nova Entrega de EPI</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Funcionário</label>
                          <input type="text" name="funcionario" value={newEntrega.funcionario} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Item (EPI)</label>
                          <input type="text" name="item" value={newEntrega.item} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                          <input type="number" name="quantidade" value={newEntrega.quantidade} onChange={handleFormChange} required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Data da Entrega</label>
                          <input type="date" name="dataEntrega" value={newEntrega.dataEntrega} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end items-center gap-3">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-secondary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Funcionário</th>
                <th scope="col" className="px-6 py-3">Item (EPI)</th>
                <th scope="col" className="px-6 py-3 text-center">Quantidade</th>
                <th scope="col" className="px-6 py-3">Data da Entrega</th>
                <th scope="col" className="px-6 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {entregas.map(item => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {item.funcionario}
                  </th>
                  <td className="px-6 py-4">{item.item}</td>
                  <td className="px-6 py-4 text-center">{item.quantidade}</td>
                  <td className="px-6 py-4">{new Date(item.dataEntrega + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleRemoveEntrega(item.id)} className="text-red-500 hover:text-red-700" aria-label="Remover">
                      <TrashIcon className="w-5 h-5 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
              {entregas.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">Nenhuma entrega de EPI registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ControleEPI;
