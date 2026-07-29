import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { DataProvider } from './lib/data';
import './index.css';
import './jack-theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><DataProvider><App /></DataProvider></BrowserRouter></StrictMode>,
);
