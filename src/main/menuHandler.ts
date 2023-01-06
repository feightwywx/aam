import { BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';

import type { Song } from 'type';
import { globalStore } from '../globalStore';
import { importSong, makePackage, mergeSonglist } from './utils/assets';

export function importSongMenuHandlerFactory(
  mainWindow: BrowserWindow,
  external = false
) {
  return async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: [
        'openDirectory',
        'treatPackageAsDirectory',
        'multiSelections',
      ],
    });
    if (!canceled) {
      const songs: Song[] = [];
      const failedPaths: string[] = [];
      const assetsPath = globalStore.get('assets.path') as string;
      for (const srcPath of filePaths) {
        const imported = await importSong(srcPath, assetsPath);
        if (imported) {
          if (external) {
            imported._external = srcPath;
          }
          songs.push(imported);
        } else {
          failedPaths.push(srcPath);
        }
      }
      const mergedSongs = await mergeSonglist(
        songs,
        globalStore.get('assets.songs') as Song[]
      );
      globalStore.set('assets.songs', mergedSongs);
      fs.writeFileSync(
        path.join(assetsPath, 'songs', 'songlist'),
        JSON.stringify({ songs: mergedSongs }, null, 2)
      );

      dialog.showMessageBox({
        message: '\n'.concat(
          `已导入 ${songs.length} 首歌曲`,
          failedPaths.length === 0
            ? ''
            : `\n\n以下歌曲导入失败：\n${failedPaths.join('\n')}`
        ),
        type: failedPaths.length === 0 ? 'info' : 'error',
      });
    }
  };
}

export function importBgMenuHandlerFactory(mainWindow: BrowserWindow) {
  return async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'treatPackageAsDirectory', 'multiSelections'],
      filters: [{ name: '背景图片', extensions: ['jpg'] }],
    });
    if (!canceled) {
      const importedBgs = [];
      const failedPaths: string[] = [];
      const assetsPath = globalStore.get('assets.path') as string;
      const imgBgPath = path.join(assetsPath, 'img', 'bg');
      filePaths.forEach((srcBgPath) => {
        const destBgPath = path.join(imgBgPath, path.basename(srcBgPath));
        log.verbose(`${srcBgPath} -> ${destBgPath}`);
        try {
          fs.copyFileSync(srcBgPath, destBgPath);
          importedBgs.push(srcBgPath);
        } catch (e) {
          log.error(e);
          failedPaths.push(srcBgPath);
        }
      });

      dialog.showMessageBox({
        message: '\n'.concat(
          `已导入 ${importedBgs.length} 张背景`,
          failedPaths.length === 0
            ? ''
            : `\n\n以下背景导入失败：\n${failedPaths.join('\n')}`
        ),
        type: failedPaths.length === 0 ? 'info' : 'error',
      });
    }
  };
}

export function generatePackageMenuHandlerFactory(mainWindow: BrowserWindow) {
  return async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: '选择导出安装包格式与位置',
      filters: [
        { name: 'iOS Application', extensions: ['ipa'] },
        { name: 'Android Package', extensions: ['apk'] },
      ],
      properties: ['createDirectory'],
    });
    if (!canceled && filePath) {
      const savePath = filePath;
      const saveExt = path.extname(savePath);

      const assetsPath = globalStore.get('assets.path') as string;
      const packageRoot = path.resolve(
        assetsPath,
        saveExt === '.ipa' ? '../..' : '..'
      );

      const songs = globalStore.get('assets.songs') as Song[];
      const songCopyPromises = songs.map((song) => {
        if (song._external) {
          log.info(`外置依赖 ${song._external}`);
          return importSong(song._external, assetsPath);
        }
        return new Promise<void>((resolve) => {
          resolve();
        });
      });
      const copyExtResult = await Promise.allSettled(songCopyPromises).catch(
        (e) => {
          dialog.showErrorBox('外部文件复制失败', e.message);
        }
      );

      if (
        copyExtResult &&
        copyExtResult.filter((r) => r.status === 'rejected').length < 1
      ) {
        const { response } = await dialog.showMessageBox(mainWindow, {
          message: `确定包路径为 ${packageRoot} 吗？`,
          type: 'question',
          buttons: ['好', '取消'],
          defaultId: 0,
          title: '确认包路径',
          detail: '这个文件夹应该包含所有需要被打包的文件。',
          cancelId: 1,
        });
        if (response === 0) {
          makePackage(packageRoot, savePath, mainWindow);
        }
      }
    }
  };
}
