import { BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import fsAsync from 'fs/promises';
import path from 'path';
import log from 'electron-log';

import type { AssetDependence, Song, Songlist } from 'type';
import { globalStore } from '../globalStore';
import { importSong, makePackage, mergeSonglist } from './utils/assets';
import { buildAssetsSongDepList } from './utils/songDeps';

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
          detail:
            '这个文件夹应该包含所有需要被打包的文件。\n\n此外，强烈建议您在打包之前进行依赖验证。',
          cancelId: 1,
        });
        if (response === 0) {
          makePackage(packageRoot, savePath, mainWindow);
        }
      }
    }
  };
}

export function verifyMenuHandlerFactory(mainWindow: BrowserWindow) {
  return async () => {
    const assetsPath = globalStore.get('assets.path') as string;
    const songsPath = path.join(assetsPath, 'songs');
    const songlistPath = path.join(songsPath, 'songlist');

    const songlistFile = await fsAsync.readFile(songlistPath);
    const songlist = JSON.parse(songlistFile.toString()) as Songlist;

    const songlistDepPromises = songlist.songs.map((song) => {
      return buildAssetsSongDepList(song);
    });

    const songlistDeps = await Promise.all(songlistDepPromises);
    log.debug(songlistDeps);
    const flattenDeps = songlistDeps.flat();

    const errPath: AssetDependence[] = [];
    flattenDeps.forEach((dep) => {
      if (!fs.existsSync(path.join(assetsPath, dep.dep))) {
        errPath.push(dep);
      }
    });

    let dialogType = 'info';
    let errCount = 0;
    const errHints: string[] = [];
    errPath.forEach((err) => {
      if (err.dep.endsWith('3.aff')) {
        dialogType = 'warning';
        errHints.push(
          `[W] ${err.sourceID} 的Beyond难度已定义但是谱面不存在，可能需要在线加载。`
        );
      } else {
        dialogType = 'error';
        errCount += 1;
        errHints.unshift(`[E] ${err.sourceID} 需要 ${err.dep}，但是它不存在。`);
      }
    });

    dialog.showMessageBox(mainWindow, {
      message:
        errPath.length === 0
          ? '没有检测到依赖问题。'
          : `检测到以下问题，其中有 ${errCount} 个错误。`,
      detail: errHints.join('\n'),
      type: dialogType,
    });
  };
}
