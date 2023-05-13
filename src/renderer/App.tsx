import { HashRouter, Routes, Route } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useMediaQuery } from 'usehooks-ts';

import './App.css';
import { AppLayout } from './components/AppLayout';
import Hello from './pages/Hello';
import Songs from './pages/Songs';
import store from './store';
import Settings from './pages/Settings';

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  return (
    <ReduxProvider store={store}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: prefersDarkMode
            ? theme.darkAlgorithm
            : theme.defaultAlgorithm,
          token: { colorPrimary: '#722ed1' },
        }}
      >
        <HashRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Hello />} />
              <Route path="/songs" element={<Songs />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </AppLayout>
        </HashRouter>
      </ConfigProvider>
    </ReduxProvider>
  );
}
