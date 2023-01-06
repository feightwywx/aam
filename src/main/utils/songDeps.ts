import path from 'path';
import log from 'electron-log';

import type { AssetDependence, Song } from 'type';

export async function buildSrcSongDepList(song: Song): Promise<string[]> {
  log.info(`buildSrcSongDepList(): build for ${song.id}`);
  const deps = [];

  deps.push('base.ogg');
  deps.push('base.jpg');
  deps.push('base_256.jpg');

  song.difficulties.forEach((diff) => {
    if (diff.rating >= 0) {
      deps.push(`${diff.ratingClass}.aff`);
    }
  });

  return deps;
}

export async function buildAssetsSongDepList(
  song: Song
): Promise<AssetDependence[]> {
  log.info(`buildAssetsSongDepList(): build for ${song.id}`);
  const deps: AssetDependence[] = [];

  function pushSongDeps(dep: string) {
    deps.push({
      dep: path.join('songs', song.remote_dl ? `dl_${song.id}` : song.id, dep),
      sourceID: song.id,
    });
  }

  function pushBgDeps(dep: string) {
    deps.push({ dep: path.join('img', 'bg', dep), sourceID: song.id });
  }

  if (song.bg) {
    pushBgDeps(`${song.bg}.jpg`);
  } else {
    switch (song.side) {
      case 0:
        pushBgDeps('base_light.jpg');
        break;
      case 1:
        pushBgDeps('base_conflict.jpg');
        break;
      default:
        break;
    }
  }

  pushSongDeps('base.jpg');
  pushSongDeps('base_256.jpg');
  song.difficulties.forEach((diff) => {
    if (diff.jacketOverride) {
      pushSongDeps(`${diff.ratingClass}.jpg`);
      pushSongDeps(`${diff.ratingClass}_256.jpg`);
    }
  });

  if (song.remote_dl) {
    pushSongDeps('preview.ogg');

    song.difficulties.forEach((diff) => {
      if (diff.audioOverride) {
        pushSongDeps(`${diff.ratingClass}_preview.ogg`);
      }
    });
  } else {
    pushSongDeps('base.ogg');

    song.difficulties.forEach((diff) => {
      if (diff.rating >= 0) {
        pushSongDeps(`${diff.ratingClass}.aff`);
      }

      if (diff.audioOverride) {
        pushSongDeps(`${diff.ratingClass}.ogg`);
      }
    });
  }

  return deps;
}

export default { buildSrcSongDepList };
