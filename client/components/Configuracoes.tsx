import React, { useState, useEffect, FormEvent } from 'react';
import { User } from '../types';
import { api } from '../utils/api';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { useAuth } from '../hooks/useAuth';

const UserModal: React.FC<{
    user: Partial<User> | null;
    onClose: () => void;
    onSave: () => void;
}> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        password: '',
    });
    const isNew = !user?.id;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.username || (isNew && !formData.password)) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        try {
            if (isNew) {
                await api.post('/api/users', formData);
            } else {
                // Only include password if it's being changed
                const payload: any = { name: formData.name, username: formData.username };
                if (formData.password) {
                    payload.password = formData.password;
                }
                await api.put(`/api/users/${user!.id}`, payload);
            }
            onSave();
            onClose();
        } catch (error) {
            alert(`Erro ao salvar usuário: ${(error as Error).message}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-800">{isNew ? 'Adicionar Usuário' : 'Editar Usuário'}</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome de Usuário</label>
                            <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={isNew} placeholder={isNew ? 'Obrigatório' : 'Deixe em branco para não alterar'} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Configuracoes: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const { user: currentUser } = useAuth();

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const data = await api.get('/api/users');
            setUsers(data);
        } catch (error) {
            alert('Falha ao carregar usuários.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user: Partial<User> | null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (currentUser?.username === username) {
            alert("Você não pode excluir sua própria conta.");
            return;
        }
        if (window.confirm(`Tem certeza que deseja excluir o usuário "${username}"?`)) {
            try {
                await api.delete(`/api/users/${userId}`);
                fetchUsers();
            } catch (error) {
                alert(`Erro ao excluir usuário: ${(error as Error).message}`);
            }
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">Carregando usuários...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
                <button onClick={() => handleOpenModal(null)} className="flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary">
                    <PlusIcon className="w-5 h-5 mr-2" /> Novo Usuário
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Nome Completo</th>
                                <th className="px-6 py-3">Nome de Usuário</th>
                                <th className="px-6 py-3">Criado em</th>
                                <th className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{user.name}</td>
                                    <td className="px-6 py-4">{user.username}</td>
                                    <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 text-center space-x-2">
                                        <button onClick={() => handleOpenModal(user)} className="p-1 text-blue-600 hover:text-blue-800" title="Editar"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteUser(user.id, user.username)} className="p-1 text-red-600 hover:text-red-800" title="Excluir"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && <UserModal user={editingUser} onClose={handleCloseModal} onSave={fetchUsers} />}
        </div>
    );
};

export default Configuracoes;
