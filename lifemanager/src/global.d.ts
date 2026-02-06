// src/global.d.ts
import { DBData } from './types';

export {};

declare global {
  interface Window {
    electronAPI: {
      dbRead: () => Promise<DBData>;
      dbWrite: (data: Partial<DBData>) => Promise<DBData>;
      dbUpdate: (key: keyof DBData, value: any) => Promise<DBData>;
    };
  }
}
