import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';

const AccountPage = lazy(() =>
  import('./pages/AccountPage').then(({ AccountPage: Page }) => ({ default: Page })),
);
const AddProductPage = lazy(() =>
  import('./pages/AddProductPage').then(({ AddProductPage: Page }) => ({ default: Page })),
);
const MenuPage = lazy(() =>
  import('./pages/MenuPage').then(({ MenuPage: Page }) => ({ default: Page })),
);
const OrdersPage = lazy(() =>
  import('./pages/OrdersPage').then(({ OrdersPage: Page }) => ({ default: Page })),
);

const deferred = (page: ReactNode) => (
  <Suspense
    fallback={
      <div className="loading-state" role="status" aria-live="polite">
        <span className="loading-state__spinner" aria-hidden="true" />
        <span>画面を準備しています</span>
      </div>
    }
  >
    {page}
  </Suspense>
);

const App = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route index element={<HomePage />} />
      <Route path="menu" element={deferred(<MenuPage />)} />
      <Route path="orders" element={deferred(<OrdersPage />)} />
      <Route path="add" element={deferred(<AddProductPage />)} />
      <Route path="account" element={deferred(<AccountPage />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default App;
