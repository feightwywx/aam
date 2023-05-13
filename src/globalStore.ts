import Store from 'electron-store';
import { StoreType } from 'type';

export const globalStore = new Store<StoreType>({
  defaults: {
    assets: {
      path: '',
    },
    settings: {
      logLevel: 'info',
    },
  },
});

export default { globalStore };
