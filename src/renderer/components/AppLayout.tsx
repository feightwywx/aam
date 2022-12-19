import { Layout, Menu, theme } from 'antd';
import type { MenuProps } from 'antd';
import PropTypes from 'prop-types';
import { useAppDispatch, useAppSelector } from 'renderer/store';
import { useNavigate } from 'react-router-dom';
import { setPath, setSongs } from 'stateSlices/assets';
import { useEffect } from 'react';

export const MainMenu: MenuProps['items'] = [
  { key: 'song', label: '曲目' },
  { key: 'bg', label: '背景' },
];

export const AppLayout: React.FC<{
  children: React.ReactNode;
  siderHidden?: boolean;
}> = ({ children, siderHidden }) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const { path } = useAppSelector((state) => state.assets);

  const assets = useAppSelector((state) => state.assets);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    window.electron.ipcRenderer.store.set('assets', assets);
  }, [assets]);

  window.aam.ipcRenderer.onCloseFolder(() => {
    dispatch(setPath(''));
    navigate('/');
  });

  window.aam.ipcRenderer.onPushSongs((_, args) => {
    dispatch(setPath(args.path));
    dispatch(setSongs(args.songs));
    navigate('/songs');
  });

  return (
    <Layout hasSider style={{ backgroundColor: colorBgContainer }}>
      <Layout.Sider
        style={{
          backgroundColor: colorBgContainer,
          paddingTop: 32,
          position: 'fixed',
          height: '100vh',
        }}
        hidden={siderHidden || path === ''}
      >
        <Menu theme="light" items={MainMenu} tabIndex={-1} />
      </Layout.Sider>
      <Layout
        style={{
          minHeight: '100vh',
          backgroundColor: colorBgContainer,
          marginLeft: siderHidden || path === '' ? 0 : 200,
        }}
      >
        <Layout.Content>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
};

AppLayout.propTypes = {
  children: PropTypes.element.isRequired,
  siderHidden: PropTypes.bool,
};

AppLayout.defaultProps = {
  siderHidden: false,
};
