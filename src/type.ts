import { LogLevel } from 'electron-log';

export interface IPCResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface SongBase {
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
  remote_dl: boolean;
  date: number;
  version: string;
  difficulties: SongDifficulty[];
}

export interface Song extends SongBase {
  _external?: string;
}

export interface SongDifficulty {
  ratingClass: 0 | 1 | 2 | 3;
  chartDesigner: string;
  jacketDesigner: string;
  rating: number;
  ratingPlus?: boolean;
  jacketOverride?: boolean;
  audioOverride?: boolean;
  hidden_until_unlocked?: true;
  hidden_until?: 'none' | 'always' | 'difficulty' | 'song';
}

export interface Songlist {
  songs: Song[];
}

export interface AssetDependence {
  dep: string;
  sourceID: string;
}

export interface StoreType {
  assets: {
    path: string;
    songs?: Song[];
  };
  settings: SettingsType;
}

export interface SettingsType {
  logLevel: LogLevel;
  minimalRating: number;
  ignoredSong: string;
}

export interface AppInfo {
  version: string;
  isDebug: boolean;
}
