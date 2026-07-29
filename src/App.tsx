import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { AccountPage } from './pages/AccountPage';
import { AddProductPage } from './pages/AddProductPage';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { OrdersPage } from './pages/OrdersPage';

const App = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route index element={<HomePage />} />
      <Route path="menu" element={<MenuPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="add" element={<AddProductPage />} />
      <Route path="account" element={<AccountPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default App;
