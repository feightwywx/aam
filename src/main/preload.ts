import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    store: {
      get(key: string) {
        return ipcRenderer.sendSync('electron-store-get', key);
      },
      set(property: string, val: unknown) {
        ipcRenderer.send('electron-store-set', property, val);
      },
      // Other method you want to add like has(), reset(), etc.
    },
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  },
});

contextBridge.exposeInMainWorld('aam', {
  ipcRenderer: {
    loadSongs: (path: string) => ipcRenderer.invoke('aam:loadSongs', path),
    onCloseFolder: (callback: (event: Event, args: unknown) => void) =>
      ipcRenderer.on('aam:closeFolder', callback),
    onPushSongs: (callback: (event: Event, args: unknown) => void) => {
      ipcRenderer.on('aam:pushSongs', callback);
    },
  },
});
