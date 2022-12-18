import path from 'path';
import fs from 'fs';
import { makeSuccessResp, makeFailResp } from './ipcResponse';

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

export default { loadSonglistIPC };
