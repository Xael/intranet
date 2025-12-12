import React, { useState, useEffect } from 'react';
import { CollectionName } from '../types';
import { Trash2, Edit, Plus, Loader2, Search, Database } from 'lucide-react'; // Adicionei ícones de volta
import { api } from '../utils/api'; // <--- IMPORTANTE: Usando a API real, não o 'db'

interface RegistryManagerProps {
  collection: CollectionName; // 'issuers' | 'recipients' | 'products'
  title: string;
  renderForm: (item: any | null, onSave: (item: any) => void, onCancel: () => void) => React.ReactNode;
  renderListItem: (item: any) => React.ReactNode;
}

export const RegistryManager: React.FC<RegistryManagerProps> = ({ collection, title, renderForm, renderListItem }) => {
  const [items, setItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // Mantive a busca que você tinha

  // Mapeia o nome da coleção para a rota da API correta
  const getEndpoint = () => {
    switch(collection) {
        case 'issuers': return '/api/issuers';
        case 'recipients': return '/api/recipients';
        case 'products': return '/api/products';
        default: return '';
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
        const endpoint = getEndpoint();
        if (!endpoint) return;

        const data = await api.get(endpoint);
        
        // CORREÇÃO CRÍTICA:
        // Se a lista vier vazia do banco, abrimos o formulário automaticamente.
        // Isso resolve a sensação de que "cliquei e não aconteceu nada".
        if (Array.isArray(data)) {
            setItems(data);
            if (data.length === 0) {
                setIsEditing(true); 
                setCurrentItem(null);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar registros", error);
        setItems([]);
        // Se der erro (ex: tabela vazia), assume modo de criação
        setIsEditing(true);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [collection]);

  const handleSave = async (item: any) => {
    try {
        const endpoint = getEndpoint();
        if (item.id) {
            // Atualizar
            await api.put(`${endpoint}/${item.id}`, item);
        } else {
            // Criar Novo
            await api.post(endpoint, item);
        }
        setIsEditing(false);
        setCurrentItem(null);
        loadItems(); // Recarrega a lista atualizada do servidor
    } catch (error) {
        alert("Erro ao salvar registro.");
        console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      try {
          const endpoint = getEndpoint();
          await api.delete(`${endpoint}/${id}`);
          loadItems();
      } catch (error) {
          alert("Erro ao excluir.");
      }
    }
  };

  // Lógica de Filtro (Mantida do seu arquivo original)
  const filteredItems = items.filter(item => 
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // MODO EDIÇÃO / CRIAÇÃO
if (isEditing) {
      return (
          // Adicionado: max-h-[85vh] e overflow-y-auto
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fade-in max-h-[85vh] overflow-y-auto flex flex-col">
              <div className="mb-4 pb-2 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-700">
                      {currentItem ? `Editar ${title}` : `Novo ${title}`}
                  </h3>
              </div>
              <div className="flex-1"> {/* Wrapper para o conteúdo empurrar o footer */}
                {renderForm(currentItem, handleSave, () => {
                    setIsEditing(false);
                    setCurrentItem(null);
                })}
              </div>
          </div>
      );
  }
  // MODO LISTAGEM
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-600" />
                {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{items.length} registros encontrados</p>
        </div>
        <button 
            onClick={() => { setCurrentItem(null); setIsEditing(true); }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
        >
            <Plus className="w-4 h-4 mr-2" /> Novo
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="mb-4 relative">
        <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            {searchTerm ? 'Nenhum resultado para a busca.' : 'Nenhum registro encontrado.'}
            <br/>
            {!searchTerm && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="mt-2 text-blue-600 hover:underline font-bold"
                >
                    Cadastre o primeiro agora
                </button>
            )}
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {filteredItems.map((item, index) => (
                <div key={item.id || index} className="flex justify-between items-center p-4 bg-white hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors group shadow-sm">
                    <div className="flex-1">
                        {renderListItem(item)}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setCurrentItem(item); setIsEditing(true); }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                            title="Editar"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                            title="Excluir"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
