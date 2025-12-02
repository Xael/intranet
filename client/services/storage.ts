import { Entity, Product, CollectionName } from '../types';
import { api } from '../utils/api';

// Mapeia os nomes das coleções do frontend para os endpoints da API
const mapCollectionToEndpoint = (collection: CollectionName): string => {
  switch (collection) {
    case 'issuers': return 'emitentes';
    case 'recipients': return 'destinatarios';
    case 'products': return 'produtos';
    case 'invoices': return 'notas';
    default: return collection;
  }
};

export const db = {
  // Agora retorna Promise<T[]>
  get: async <T>(collection: CollectionName): Promise<T[]> => {
    try {
      const endpoint = `/api/nfe/${mapCollectionToEndpoint(collection)}`;
      const data = await api.get(endpoint);
      return data || [];
    } catch (error) {
      console.error(`Erro ao buscar ${collection}:`, error);
      return [];
    }
  },

  // Agora é async e faz POST ou PUT
  save: async <T extends { id?: string }>(collection: CollectionName, item: T): Promise<T> => {
    try {
      const endpoint = `/api/nfe/${mapCollectionToEndpoint(collection)}`;
      let savedItem;
      
      if (item.id) {
        // Tenta atualizar. A lógica de "criar se não existir" para IDs gerados no front 
        // pode ser tratada no backend ou tentando PUT e fallback para POST.
        // No server.js implementamos o POST para tratar upsert se ID vier, ou o PUT direto.
        // Vamos usar POST por padrão se o ID for novo (gerado por crypto no front), 
        // mas se for edição de registro existente, usamos PUT.
        
        // Simplificação: Nossa API server.js no POST verifica se ID existe e faz upsert/update.
        // Então POST é seguro para salvar (criar ou atualizar).
        savedItem = await api.post(endpoint, item);
      } else {
        savedItem = await api.post(endpoint, item);
      }
      return savedItem;
    } catch (error) {
      console.error(`Erro ao salvar em ${collection}:`, error);
      throw error;
    }
  },

  delete: async (collection: CollectionName, id: string): Promise<void> => {
    try {
      const endpoint = `/api/nfe/${mapCollectionToEndpoint(collection)}/${id}`;
      await api.delete(endpoint);
    } catch (error) {
      console.error(`Erro ao deletar de ${collection}:`, error);
      throw error;
    }
  },

  exportData: async (collection: CollectionName): Promise<void> => {
    const data = await db.get(collection);
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${collection}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: (collection: CollectionName, file: File, callback: (success: boolean) => void): void => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // Importa um por um via API
          for (const item of parsed) {
             await db.save(collection, item);
          }
          callback(true);
        } else {
          callback(false);
        }
      } catch (err) {
        console.error("Import error", err);
        callback(false);
      }
    };
    reader.readAsText(file);
  }
};