// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  dbRead: () => ipcRenderer.invoke('db:read'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbWrite: (data: any) => ipcRenderer.invoke('db:write', data),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbUpdate: (key: string, value: any) => ipcRenderer.invoke('db:update', key, value),
});
