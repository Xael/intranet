import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/storage';
import { CollectionName } from '../types';
import { Trash2, Edit, Download, Upload, Plus, Search, Database } from 'lucide-react';

interface RegistryManagerProps {
  collection: CollectionName;
  title: string;
  renderForm: (item: any | null, onSave: (item: any) => void, onCancel: () => void) => React.ReactNode;
  renderListItem: (item: any) => React.ReactNode;
}

export const RegistryManager: React.FC<RegistryManagerProps> = ({ collection, title, renderForm, renderListItem }) => {
  const [items, setItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadItems = async () => {
    const data = await db.get(collection);
    setItems(data);
  };

  useEffect(() => {
    loadItems();
  }, [collection]);

  const handleSave = async (item: any) => {
    await db.save(collection, item);
    setIsEditing(false);
    setCurrentItem(null);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      await db.delete(collection, id);
      loadItems();
    }
  };

  const handleExport = () => {
    db.exportData(collection);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      db.importData(collection, e.target.files[0], (success) => {
        if (success) {
          alert('Importação realizada com sucesso!');
          loadItems();
        } else {
          alert('Erro ao importar arquivo. Verifique o formato JSON.');
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
    }
  };

  const filteredItems = items.filter(item => 
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-4 pb-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">{currentItem ? 'Editar' : 'Novo'} Registro</h3>
        </div>
        {renderForm(currentItem, handleSave, () => {
          setIsEditing(false);
          setCurrentItem(null);
        })}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-100 gap-4">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary-600" />
                {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{items.length} registros encontrados</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleExport}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm transition-colors"
                title="Exportar JSON"
            >
                <Download className="w-4 h-4 mr-2" />
                Exportar
            </button>
            <button 
                onClick={handleImportClick}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm transition-colors"
                title="Importar JSON"
            >
                <Upload className="w-4 h-4 mr-2" />
                Importar
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange} 
            />
            <button 
                onClick={() => { setCurrentItem(null); setIsEditing(true); }}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm font-medium transition-colors"
            >
                <Plus className="w-4 h-4 mr-2" />
                Novo
            </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {filteredItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                Nenhum registro encontrado.
            </div>
        ) : (
            <div className="space-y-3">
                {filteredItems.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-center p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-lg transition-colors group">
                        <div className="flex-1">
                            {renderListItem(item)}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => { setCurrentItem(item); setIsEditing(true); }}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
