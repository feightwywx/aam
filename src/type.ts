export interface IPCResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface Song {
  idx: number;
  id: string;
  title_localized: {
    en: string;
    ja?: string;
  };
  artist: string;
  bpm: string;
  bpm_base: number;
  set: string;
  purchase: string;
  audioPreview: number;
  audioPreviewEnd: number;
  side: 0 | 1 | 2;
  bg: string;
  date: number;
  version: string;
  difficulties: SongDifficulty[];
}

export interface SongDifficulty {
  ratingClass: 0 | 1 | 2 | 3;
  chartDesigner: string;
  jacketDesigner: string;
  rating: number;
  ratingPlus?: boolean;
}
