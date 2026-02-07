// src/services/db.ts
import type { DBData } from '../types';

export const getDB = async (): Promise<DBData> => {
  if (window.electronAPI) {
    return await window.electronAPI.dbRead();
  }
  // Fallback for development in browser (mock data)
  console.warn('Electron API not found, using mock data');
  return {
    tasks: [],
    habits: [],
    habitLogs: {},
    focusLogs: [],
    journals: {},
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateDB = async (key: keyof DBData, value: any): Promise<DBData> => {
  if (window.electronAPI) {
    return await window.electronAPI.dbUpdate(key, value);
  }
  return {
    tasks: [],
    habits: [],
    habitLogs: {},
    focusLogs: [],
    journals: {},
  };
};
