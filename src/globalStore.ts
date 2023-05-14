import Store from 'electron-store';
import { StoreType } from 'type';

export const globalStore = new Store<StoreType>({
  defaults: {
    assets: {
      path: '',
    },
    settings: {
      logLevel: 'info',
      minimalRating: 0,
      ignoredSong:
        'arcahv,tempestissimo,defection,infinitestrife,worldender,pentiment,arcanaeden,testify,lovelessdress,last,lasteternity,callimakarma,ignotusafterburn,redandblueandgreen,singularityvvvip,overdead,mismal',
    },
  },
});

export default { globalStore };
