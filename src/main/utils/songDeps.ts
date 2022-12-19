import { Song } from 'type';

export async function buildSrcSongDepList(song: Song): Promise<string[]> {
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

export default { buildSrcSongDepList };
