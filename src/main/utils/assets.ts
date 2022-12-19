import path from 'path';
import fs from 'fs';
import log from 'electron-log';

import { makeSuccessResp, makeFailResp } from './ipcResponse';
import type { Song } from '../../type';
import { buildSrcSongDepList } from './songDeps';

export async function loadSonglistIPC(assetsPath: string) {
  const songlistPath = path.join(assetsPath, 'songs', 'songlist');
  if (fs.existsSync(songlistPath)) {
    const songlistString = fs.readFileSync(songlistPath).toString();

    try {
      const songlist = JSON.parse(songlistString);
      return makeSuccessResp(songlist.songs);
    } catch (e) {
      return makeFailResp((e as Error).toString());
    }
  }
  return makeFailResp('Songlist not found');
}

export async function importSong(
  src: string,
  assets: string
): Promise<Song | undefined> {
  log.info(`trying import song from ${src} to ${assets}`);
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
