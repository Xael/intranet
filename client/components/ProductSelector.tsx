import React, { useState, useEffect } from 'react';
import { db } from '../services/storage';
import { Product } from '../types';
import { Search, Plus, X, Globe } from 'lucide-react';

interface ProductSelectorProps {
  onSelect: (product: Product) => void;
  onClose: () => void;
  externalProducts?: Product[]; // Optional prop for Intranet data
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({ onSelect, onClose, externalProducts }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
        const localProducts = await db.get<Product>('products');
        // Mark external products to distinguish them in UI (optional but helpful)
        const markedExternal = (externalProducts || []).map(p => ({...p, isExternal: true}));
        setProducts([...localProducts, ...markedExternal]);
    };
    loadData();
  }, [externalProducts]);

  const filtered = products.filter(p => 
    p.descricao.toLowerCase().includes(search.toLowerCase()) || 
    p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[500px] flex flex-col shadow-xl animate-fade-in">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-lg text-gray-800">Selecionar Produto</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
            </button>
        </div>
        
        <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="relative">
                <input 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Buscar por código ou descrição..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {filtered.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <p>Nenhum produto encontrado.</p>
                </div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2">Código</th>
                            <th className="px-4 py-2">Descrição</th>
                            <th className="px-4 py-2 text-right">Preço</th>
                            <th className="px-4 py-2 text-center">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr key={p.id} className="border-b hover:bg-blue-50 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs">
                                    {p.codigo}
                                    {(p as any).isExternal && <Globe className="w-3 h-3 inline-block ml-1 text-blue-400" title="Origem: Intranet" />}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{p.descricao}</div>
                                    <div className="text-xs text-gray-500">NCM: {p.ncm || '---'} | CFOP: {p.cfop || '---'}</div>
                                </td>
                                <td className="px-4 py-3 text-right">R$ {p.valorUnitario.toFixed(2)}</td>
                                <td className="px-4 py-3 text-center">
                                    <button 
                                        onClick={() => onSelect(p)}
                                        className="bg-primary-100 text-primary-700 p-2 rounded hover:bg-primary-200 transition-colors"
                                        title="Selecionar"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};
