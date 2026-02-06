// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  dbRead: () => ipcRenderer.invoke('db:read'),
  dbWrite: (data: any) => ipcRenderer.invoke('db:write', data),
  dbUpdate: (key: string, value: any) => ipcRenderer.invoke('db:update', key, value),
});
