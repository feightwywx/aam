import { HashRouter, Routes, Route } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';

import './App.css';
import { AppLayout } from './components/AppLayout';
import Hello from './pages/Hello';
import Songs from './pages/Songs';
import store from './store';

export default function App() {
  return (
    <ReduxProvider store={store}>
      <HashRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Hello />} />
            <Route path="/songs" element={<Songs />} />
          </Routes>
        </AppLayout>
      </HashRouter>
    </ReduxProvider>
  );
}
