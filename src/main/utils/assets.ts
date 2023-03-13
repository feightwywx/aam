import path from 'path';
import fs from 'fs';
import fsAsync from 'fs/promises';
import log from 'electron-log';
import archiver, { ProgressData } from 'archiver';
import { app, BrowserWindow, dialog } from 'electron';

import { makeSuccessResp, makeFailResp } from './ipcResponse';
import type { Song, Songlist } from '../../type';
import { buildSrcSongDepList } from './songDeps';
import { globalStore } from '../../globalStore';

export async function loadSonglistIPC(assetsPath: string) {
  log.info(`loadSonglistIPC(): assets: ${assetsPath}`);
  const songlistPath = path.join(assetsPath, 'songs', 'songlist');
  if (fs.existsSync(songlistPath)) {
    const songlistString = fs.readFileSync(songlistPath).toString();

    try {
      const songlist = JSON.parse(songlistString);
      if ('songs' in songlist && Array.isArray(songlist.songs)) {
        return makeSuccessResp(songlist.songs);
      }
      return makeFailResp('songlist格式错误');
    } catch (e) {
      return makeFailResp((e as Error).toString());
    }
  }
  return makeFailResp('不合法的Assets文件夹：未找到songlist');
}

export async function saveSonglistIPC(songlist: Songlist) {
  log.info(`saveSongsIPC()`);
  const assetsPath = globalStore.get('assets.path') as string;
  const songlistPath = path.join(assetsPath, 'songs', 'songlist');
  if (fs.existsSync(songlistPath)) {
    try {
      fs.writeFileSync(songlistPath, JSON.stringify(songlist, undefined, 2));
      return makeSuccessResp({});
    } catch (e) {
      return makeFailResp((e as Error).toString());
    }
  }
  return makeFailResp('不合法的Assets文件夹：未找到songlist');
}

export async function deleteSongsIPC(ids: string[]) {
  log.info(`deleteSongsIPC(): ${ids.join(',')}`);
  const assetsPath = globalStore.get('assets.path') as string;
  const deleteSongPromises = ids.map(
    (songId) =>
      new Promise<void>((resolve, reject) => {
        const songDir = path.join(assetsPath, 'songs', songId);
        log.info(`deleting ${songDir}`);
        try {
          fs.rmSync(songDir, { recursive: true, force: true });
          resolve();
        } catch (e) {
          log.error(e);
          reject(e);
        }
      })
  );
  const deleteSongResults = await Promise.allSettled(deleteSongPromises);
  for (const result of deleteSongResults) {
    if (result.status === 'rejected') {
      return makeFailResp(result.reason);
    }
  }
  return makeSuccessResp({});
}

export async function importSong(
  src: string,
  assets: string
): Promise<Song | undefined> {
  log.info(`importSong(): trying import song from ${src} to ${assets}`);
  const srcSonglistPath = path.join(src, 'songlist');
  if (fs.existsSync(srcSonglistPath)) {
    const srcSonglistString = fs.readFileSync(srcSonglistPath).toString();
    const srcSonglist = JSON.parse(srcSonglistString);
    if (Array.isArray(srcSonglist.songs) && srcSonglist.songs.length > 0) {
      const srcSong = srcSonglist.songs[0] as Song;
      const destSongPath = path.join(assets, 'songs', srcSong.id);

      if (!fs.existsSync(destSongPath)) {
        fs.mkdirSync(destSongPath);
      }

      const srcFiles = await buildSrcSongDepList(srcSong);

      srcFiles.concat('songlist').forEach((file) => {
        const fullSrcPath = path.join(src, file);
        const fullDestPath = path.join(destSongPath, file);
        log.verbose(fullSrcPath, ' -> ', fullDestPath);

        fs.copyFileSync(fullSrcPath, fullDestPath);
      });

      return srcSong;
    }
  }
  return undefined;
}

export async function mergeSonglist(src: Song[], dest: Song[]) {
  log.info(`mergeSonglist()`);
  src.forEach((song) => {
    if (!dest.find((s) => s.id === song.id)) {
      dest.push(song);
    } else {
      const destIndex = dest.findIndex((s) => s.id === song.id);
      dest[destIndex] = song;
    }
  });
  return dest;
}

export async function verifyAssets(path: string) {}

export async function makePackage(
  src: string,
  dest: string,
  mainWindow?: BrowserWindow
): Promise<string | void> {
  log.info(`makePackage(): ${src} -> ${dest}`);
  mainWindow?.webContents.send('aam:startGeneratePackage');
  const sysTemp = app.getPath('temp');
  const tmpDir = fs.mkdtempSync(path.join(sysTemp, 'aam-assets-'));
  const tmpPackagePath = path.join(tmpDir, path.basename(dest));

  const assetContains = await fsAsync.readdir(src);
  const output = fs.createWriteStream(tmpPackagePath);
  const archive = archiver('zip');
  archive.pipe(output);
  for (const rootAsset of assetContains) {
    const fullRootAssetPath = path.join(src, rootAsset);
    if (fs.lstatSync(fullRootAssetPath).isFile()) {
      archive.file(fullRootAssetPath, { name: rootAsset });
    } else {
      archive.directory(fullRootAssetPath, rootAsset);
    }
  }

  const parseSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    }
    if (size < 1024 * 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(2)} MB`;
    }
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  let lastReport = Date.now();
  archive.on('entry', () => {
    const now = Date.now();
    if (now - lastReport > 1000) {
      const size = archive.pointer();
      mainWindow?.webContents.send('aam:log', parseSize(size));
      lastReport = Date.now();
    }
  });

  // const progressHandler = (e: ProgressData) => {
  //   log.debug(`${e.entries.processed} entries / ${e.fs.processedBytes} bytes`);
  //   mainWindow?.webContents.send(
  //     'aam:log',
  //     `${(e.fs.processedBytes / 1024 / 1024).toLocaleString(undefined, {
  //       maximumFractionDigits: 2,
  //     })} MB`
  //   );
  //   setTimeout(() => {
  //     archive.once('progress', progressHandler);
  //   }, 1000);
  // };
  // archive.once('progress', progressHandler);

  await archive.finalize().catch((e: Error) => {
    log.error(e);
    dialog.showErrorBox('打包错误', e.toString());
  });

  await new Promise<void>((resolve) => {
    // 文件流关闭时触发复制
    output.once('close', () => {
      try {
        mainWindow?.webContents.send('aam:log', '即将完成...');
        log.info(`打包完成，复制文件 ${tmpPackagePath} -> ${dest}`);
        fs.copyFileSync(tmpPackagePath, dest);
        mainWindow?.webContents.send('aam:stopGeneratePackage');
        dialog.showMessageBox({
          message: '导出成功',
          detail: `已导出：${dest}`,
        });
        resolve();
      } catch (e) {
        log.error(e);
        dialog.showErrorBox('打包错误', (e as Error).toString());
      } finally {
        log.info(`清理 ${tmpDir}`);
        fs.rmSync(tmpDir, { recursive: true });
      }
    });
  });
}
