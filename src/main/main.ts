/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
// import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { makeFailResp, makeSuccessResp } from './utils/ipcResponse';
import { deleteSongsIPC, loadSonglistIPC, saveSonglistIPC } from './utils/assets';
import { globalStore } from '../globalStore';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import { Song, Songlist } from 'type';

// class AppUpdater {
//   constructor() {
//     log.transports.file.level = 'info';
//     autoUpdater.logger = log;
//     autoUpdater.checkForUpdatesAndNotify();
//   }
// }

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1015,
    height: 620,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('close', (e) => {
    if (mainWindow && !isDebug) {
      const response = dialog.showMessageBoxSync(mainWindow, {
        message: '???????????????',
        type: 'question',
        buttons: ['???', '??????'],
        defaultId: 0,
        title: '??????',
        detail: '??????????????????????????????',
        cancelId: 1,
      });
      if (response === 1) {
        e.preventDefault();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  const menu = menuBuilder.buildMenu();

  globalStore.onDidChange('assets.path', (newValue) => {
    log.debug(!!newValue, menu.getMenuItemById('file.import')?.enabled)
    menu.getMenuItemById('file.import.song')!.enabled = !!newValue;
    menu.getMenuItemById('file.import.songLink')!.enabled = !!newValue;
    menu.getMenuItemById('file.import.bg')!.enabled = !!newValue;

    menu.getMenuItemById('file.closeFolder')!.enabled = !!newValue;

    menu.getMenuItemById('build.build')!.enabled = !!newValue;
    menu.getMenuItemById('build.verify')!.enabled = !!newValue;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // // Remove this if your app does not use auto updates
  // // eslint-disable-next-line
  // new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  app.quit();
});

app
  .whenReady()
  .then(() => {
    installExtension(REDUX_DEVTOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));

    createWindow();

    ipcMain.on('electron-store-get', async (event, val) => {
      event.returnValue = globalStore.get(val);
    });
    ipcMain.on('electron-store-set', async (event, key, val) => {
      globalStore.set(key, val);
    });

    globalStore.onDidAnyChange((newValue) => {
      mainWindow?.webContents.send(
        'aam:pushSongs',
        (newValue as { assets: unknown }).assets
      );
    });

    ipcMain.handle('dialog:openDirectory', async () => {
      if (mainWindow) {
        const { canceled, filePaths } = await dialog.showOpenDialog(
          mainWindow,
          {
            properties: ['openDirectory', 'treatPackageAsDirectory'],
          }
        );
        if (canceled) {
          return '';
        }
        return filePaths[0];
      }
      return '';
    });

    ipcMain.handle('aam:loadSongs', async (_, assetsPath: string) => {
      const songlist = await loadSonglistIPC(assetsPath);
      if (songlist.code !== 0) {
        dialog.showErrorBox('??????', songlist.message);
      }
      return songlist;
    });
    ipcMain.handle('aam:saveSonglist', async (_, songlist: Songlist) => {
      const resp = await saveSonglistIPC(songlist);
      if (resp.code !== 0) {
        dialog.showErrorBox('??????', resp.message);
      }
      return resp;
    });
    ipcMain.handle('aam:deleteSongs', async (_, ids: string[]) => {
      const resp = await deleteSongsIPC(ids);
      if (resp.code !== 0) {
        dialog.showErrorBox('??????', resp.message);
      }
      return resp;
    });
  })
  .catch(console.log);
