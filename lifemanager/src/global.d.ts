// src/global.d.ts
import { DBData } from './types';

export {};

declare global {
  interface Window {
    electronAPI: {
      dbRead: () => Promise<DBData>;
      dbWrite: (data: Partial<DBData>) => Promise<DBData>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dbUpdate: (key: keyof DBData, value: any) => Promise<DBData>;
    };
  }
}
