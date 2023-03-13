import { Channels } from 'main/preload';
import { IPCResponse, Song, Songlist } from '../type';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage(channel: Channels, args: unknown[]): void;
        on(
          channel: Channels,
          func: (...args: unknown[]) => void
        ): (() => void) | undefined;
        once(channel: Channels, func: (...args: unknown[]) => void): void;
        openDirectory: () => Promise<string | undefined>;

        store: {
          get: (key: string) => unknown;
          set: (key: string, val: unknown) => void;
          // any other methods you've defined...
        };
      };
    };

    aam: {
      ipcRenderer: {
        loadSongs: (path: string) => Promise<IPCResponse<Song[]>>;
        saveSonglist: (songlist: Songlist) => Promise<IPCResponse>;
        deleteSongs: (ids: string[]) => Promise<IPCResponse>;

        onCloseFolder: (
          callback: (event: Event, args: unknown) => void
        ) => void;
        onPushSongs: (
          callback: (
            event: Event,
            args: { path: string; songs: Song[] }
          ) => void
        ) => void;
        onStartGeneratePackage: (
          callback: (event: Event, args: unknown) => void
        ) => void;
        onStopGeneratePackage: (
          callback: (event: Event, args: unknown) => void
        ) => void;
        onLog: (callback: (event: Event, args: string) => void) => void;
      };
    };
  }
}

export {};
