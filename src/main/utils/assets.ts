import path from 'path';
import fs from 'fs';
import fsAsync from 'fs/promises';
import log from 'electron-log';
import archiver from 'archiver';
import { app, BrowserWindow, dialog } from 'electron';

import { makeSuccessResp, makeFailResp } from './ipcResponse';
import type { Song } from '../../type';
import { buildSrcSongDepList } from './songDeps';

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
  await archive.finalize().catch((e: Error) => {
    log.error(e);
    dialog.showErrorBox('打包错误', e.toString());
  });

  // 文件流关闭时触发复制
  output.on('close', () => {
    try {
      fs.copyFileSync(tmpPackagePath, dest);
      dialog.showMessageBox({
        message: '导出成功',
        detail: `已导出：${dest}`,
      });
    } catch (e) {
      log.error(e);
      dialog.showErrorBox('打包错误', (e as Error).toString());
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
}
