import path from 'path';
import log from 'electron-log';

import type { AssetDependence, Song } from 'type';
import { globalStore } from '../../globalStore';

export async function buildSrcSongDepList(song: Song): Promise<string[]> {
  log.info(`buildSrcSongDepList(): build for ${song.id}`);
  const deps = [];

  deps.push('base.ogg');
  deps.push('base.jpg');
  deps.push('base_256.jpg');

  song.difficulties.forEach((diff) => {
    if (diff.rating >= globalStore.store.settings.minimalRating) {
      deps.push(`${diff.ratingClass}.aff`);
    }

    if (diff.jacketOverride) {
      deps.push(`${diff.ratingClass}.jpg`);
      deps.push(`${diff.ratingClass}_256.jpg`);
    }

    if (diff.audioOverride) {
      deps.push(`${diff.ratingClass}.ogg`);
    }
  });

  return deps;
}

export async function buildAssetsSongDepList(
  song: Song
): Promise<AssetDependence[]> {
  log.info(`buildAssetsSongDepList(): build for ${song.id}`);
  if (globalStore.store.settings.ignoredSong.split(',').includes(song.id)) {
    log.info(`skipped, song in ignoredSong`);
    return [];
  }

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
      if (diff.rating >= globalStore.store.settings.minimalRating) {
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
