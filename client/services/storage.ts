import { Entity, Product, CollectionName } from '../types';

const STORAGE_PREFIX = 'nfe_ai_db_';

export const db = {
  get: <T>(collection: CollectionName): T[] => {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${collection}`);
    return data ? JSON.parse(data) : [];
  },

  save: <T extends { id?: string }>(collection: CollectionName, item: T): void => {
    const items = db.get<T>(collection);
    const existingIndex = items.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      // Ensure ID
      if (!item.id) item.id = crypto.randomUUID();
      items.push(item);
    }
    
    localStorage.setItem(`${STORAGE_PREFIX}${collection}`, JSON.stringify(items));
  },

  delete: (collection: CollectionName, id: string): void => {
    const items = db.get<any>(collection);
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(`${STORAGE_PREFIX}${collection}`, JSON.stringify(filtered));
  },

  exportData: (collection: CollectionName): void => {
    const data = db.get(collection);
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
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // Merge strategy: Append distinct IDs, overwrite existing IDs
          const current = db.get<any>(collection);
          const currentMap = new Map(current.map(i => [i.id, i]));
          
          parsed.forEach(item => {
             if(!item.id) item.id = crypto.randomUUID();
             currentMap.set(item.id, item);
          });
          
          localStorage.setItem(`${STORAGE_PREFIX}${collection}`, JSON.stringify(Array.from(currentMap.values())));
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