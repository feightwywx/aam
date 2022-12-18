import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Song } from 'type';

interface assetsState {
  path: string;
  songs?: Song[];
}

const initialState: assetsState = {
  path: '',
};

export const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setPath: (state, action: PayloadAction<string>) => {
      state.path = action.payload;
    },
    setSongs: (state, action: PayloadAction<Song[]>) => {
      state.songs = action.payload;
    }
  },
});

export const { setPath, setSongs } = assetsSlice.actions;
export default assetsSlice.reducer;
