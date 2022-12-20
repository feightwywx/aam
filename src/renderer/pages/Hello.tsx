import './Hello.css';
import { setPath, setSongs } from 'stateSlices/assets';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../store';

const Hello = () => {
  const assets = useAppSelector((state) => state.assets);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <>
      <Button
        onClick={async () => {
          const dir = await window.electron.ipcRenderer.openDirectory();
          if (dir) {
            const songsResp = await window.aam.ipcRenderer.loadSongs(dir);
            if (songsResp.code === 0) {
              dispatch(setPath(dir));
              dispatch(setSongs(songsResp.data));
              navigate('/songs');
            }
          }
        }}
      >
        加载Assets
      </Button>
      <p>{assets.path}</p>
    </>
  );
};

export default Hello;
