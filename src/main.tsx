import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from './App';
import { DataProvider } from './lib/data';
import './index.css';
import './jack-theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><HashRouter><DataProvider><App /></DataProvider></HashRouter></StrictMode>,
);
