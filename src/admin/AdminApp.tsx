import { Helmet } from "react-helmet-async";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireStaff } from "./auth/RequireStaff";
import { AdminLayout } from "./components/AdminLayout";
import LoginPage from "./pages/LoginPage";
import ProductsListPage from "./pages/ProductsListPage";
import ProductEditorPage from "./pages/ProductEditorPage";
import CategoriesPage from "./pages/CategoriesPage";

/** Mounted at `/admin/*` (lazy, see route.tsx). Routes below are relative to /admin. */
const AdminApp = () => (
  <>
    <Helmet>
      <title>Admin | Kritex</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route
        element={
          <RequireStaff>
            <AdminLayout />
          </RequireStaff>
        }
      >
        <Route index element={<Navigate to="products" replace />} />
        <Route path="products" element={<ProductsListPage />} />
        <Route path="products/new" element={<ProductEditorPage />} />
        <Route path="products/:id" element={<ProductEditorPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="*" element={<Navigate to="products" replace />} />
      </Route>
    </Routes>
  </>
);

export default AdminApp;
