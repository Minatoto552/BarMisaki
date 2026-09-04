import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { CartProvider } from "./lib/cart-context";

const AccountPage = lazy(() =>
  import("./pages/AccountPage").then(({ AccountPage: Page }) => ({
    default: Page,
  })),
);
const EditProductsPage = lazy(() =>
  import("./pages/EditProductsPage").then(({ EditProductsPage: Page }) => ({
    default: Page,
  })),
);
const MenuPage = lazy(() =>
  import("./pages/MenuPage").then(({ MenuPage: Page }) => ({ default: Page })),
);
const OrdersPage = lazy(() =>
  import("./pages/OrdersPage").then(({ OrdersPage: Page }) => ({
    default: Page,
  })),
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
  <CartProvider>
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/order" replace />} />
        <Route path="order" element={deferred(<MenuPage />)} />
        <Route path="menu" element={<Navigate to="/order" replace />} />
        <Route path="orders" element={deferred(<OrdersPage />)} />
        <Route
          path="add"
          element={<Navigate to="/products?create=1" replace />}
        />
        <Route path="products" element={deferred(<EditProductsPage />)} />
        <Route path="account" element={deferred(<AccountPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </CartProvider>
);

export default App;
