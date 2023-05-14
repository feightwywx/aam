import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Song, Songlist } from 'type';

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
    showLogFile: () => ipcRenderer.invoke('showLogFile'),
    reset: () => ipcRenderer.invoke('reset'),
    getAppInfo: () => ipcRenderer.invoke('getAppInfo'),
  },
});

contextBridge.exposeInMainWorld('aam', {
  ipcRenderer: {
    loadSongs: (path: string) => ipcRenderer.invoke('aam:loadSongs', path),
    saveSonglist: (songlist: Songlist) =>
      ipcRenderer.invoke('aam:saveSonglist', songlist),
    deleteSongs: (ids: string[]) => ipcRenderer.invoke('aam:deleteSongs', ids),

    onCloseFolder: (callback: (event: Event, args: unknown) => void) =>
      ipcRenderer.on('aam:closeFolder', callback),
    onPushSongs: (callback: (event: Event, args: unknown) => void) => {
      ipcRenderer.on('aam:pushSongs', callback);
    },
    onStartGeneratePackage: (
      callback: (event: Event, args: unknown) => void
    ) => {
      ipcRenderer.on('aam:startGeneratePackage', callback);
    },
    onStopGeneratePackage: (
      callback: (event: Event, args: unknown) => void
    ) => {
      ipcRenderer.on('aam:stopGeneratePackage', callback);
    },
    onLog: (callback: (event: Event, args: string) => void) => {
      ipcRenderer.on('aam:log', callback);
    },
  },
});
