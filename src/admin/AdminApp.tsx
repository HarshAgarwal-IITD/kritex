import { Helmet } from "react-helmet-async";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireStaff } from "./auth/RequireStaff";
import { AdminLayout } from "./components/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersListPage from "./pages/OrdersListPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import CustomersListPage from "./pages/CustomersListPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import BusinessApprovalsPage from "./pages/BusinessApprovalsPage";
import CouponsPage from "./pages/CouponsPage";
import EnquiriesPage from "./pages/EnquiriesPage";
import QuotesListPage from "./pages/QuotesListPage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import ProductsListPage from "./pages/ProductsListPage";
import ProductEditorPage from "./pages/ProductEditorPage";
import CategoriesPage from "./pages/CategoriesPage";
import InventoryPage from "./pages/InventoryPage";

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
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersListPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="customers" element={<CustomersListPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="b2b-approvals" element={<BusinessApprovalsPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="enquiries" element={<EnquiriesPage />} />
        <Route path="quotes" element={<QuotesListPage />} />
        <Route path="quotes/:id" element={<QuoteDetailPage />} />
        <Route path="products" element={<ProductsListPage />} />
        <Route path="products/new" element={<ProductEditorPage />} />
        <Route path="products/:id" element={<ProductEditorPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  </>
);

export default AdminApp;
