import { Channels } from 'main/preload';
import { IPCResponse, Song } from '../type';

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
      };

      store: {
        get: (key: string) => unknown;
        set: (key: string, val: unknown) => void;
        // any other methods you've defined...
      };
    };

    aam: {
      ipcRenderer: {
        loadSongs: (path: string) => Promise<IPCResponse<Song[]>>;
        onCloseFolder: (
          callback: (event: Event, args: unknown) => void
        ) => void;
        onPushSongs: (
          callback: (
            event: Event,
            args: { path: string; songs: Song[] }
          ) => void
        ) => void;
      };
    };
  }
}

export {};
