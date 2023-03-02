import { Button, Layout, Menu, theme } from 'antd';
import type { MenuProps } from 'antd';
import PropTypes from 'prop-types';
import { useAppDispatch, useAppSelector } from 'renderer/store';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';
import { setPath, setSongs } from 'stateSlices/assets';
import { useEffect } from 'react';
import { AlignLeftOutlined, PictureOutlined, SettingOutlined } from '@ant-design/icons';

export const MainMenu: MenuProps['items'] = [
  { key: 'songs', label: '曲目', icon: <AlignLeftOutlined /> },
  { key: 'bg', label: '背景', icon: <PictureOutlined />, disabled: true },
  { key: 'setting', label: '设置', icon: <SettingOutlined />, disabled: true}
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
  const location = useLocation();
  console.log(location.pathname);

  useEffect(() => {
    window.electron.ipcRenderer.store.set('assets', assets);
    if (!assets.path) {
      navigate('/');
    }
  }, [assets, navigate]);

  // 注册ipc listener
  useEffect(() => {
    window.aam.ipcRenderer.onCloseFolder(() => {
      dispatch(setPath(''));
      navigate('/');
    });

    window.aam.ipcRenderer.onPushSongs((_, args) => {
      dispatch(setPath(args.path));
      dispatch(setSongs(args.songs));
      navigate('/songs');
    });
  }, [dispatch, navigate]);

  return (
    <Layout style={{ backgroundColor: colorBgContainer }}>
      <Layout.Sider
        style={{
          backgroundColor: colorBgContainer,
          padding: 0,
          position: 'sticky',
          top: '0',
          zIndex: 999,
        }}
        hidden={siderHidden || path === ''}
        collapsible
        defaultCollapsed
        theme="light"
      >
        <Menu
          theme="light"
          mode="vertical"
          items={MainMenu}
          tabIndex={-1}
          selectedKeys={MainMenu.map((item) => {
            if (item && location.pathname === `/${item.key}`) {
              return `${item.key}`;
            }
            return '';
          })}
        />
      </Layout.Sider>
      <Layout
        style={{
          display: 'flex',
          height: '100%',
          backgroundColor: colorBgContainer,
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
