import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Products from "./pages/Products.tsx";
import Category from "./pages/Category.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import LegalIndex from "./pages/legal/LegalIndex.tsx";
import Terms from "./pages/legal/Terms.tsx";
import Privacy from "./pages/legal/Privacy.tsx";
import Returns from "./pages/legal/Returns.tsx";
import Shipping from "./pages/legal/Shipping.tsx";
import Cancellation from "./pages/legal/Cancellation.tsx";
import LegalContact from "./pages/legal/Contact.tsx";
import { AdminRoute } from "./admin/route";
import CartPage from "./pages/Cart.tsx";
import { CartDrawerProvider } from "./features/cart/components/CartDrawer";
import RequireAuth from "./features/account/components/RequireAuth";

// Checkout, auth and account pages are split out of the main bundle.
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutResult.tsx").then((m) => ({ default: m.CheckoutSuccess })));
const CheckoutFailure = lazy(() => import("./pages/CheckoutResult.tsx").then((m) => ({ default: m.CheckoutFailure })));
const CheckoutPending = lazy(() => import("./pages/CheckoutResult.tsx").then((m) => ({ default: m.CheckoutPending })));
const Login = lazy(() => import("./pages/Login.tsx"));
const Signup = lazy(() => import("./pages/Signup.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const AccountProfile = lazy(() => import("./pages/account/Profile.tsx"));
const AccountOrders = lazy(() => import("./pages/account/Orders.tsx"));
const AccountOrderDetail = lazy(() => import("./pages/account/OrderDetail.tsx"));
const AccountAddresses = lazy(() => import("./pages/account/Addresses.tsx"));
const AccountBusiness = lazy(() => import("./pages/account/Business.tsx"));

const guard = (el: JSX.Element) => <RequireAuth>{el}</RequireAuth>;

/** Blank page-height placeholder while a lazy route loads (keeps the dark background, no layout jump). */
const RouteFallback = () => <div className="min-h-screen bg-background" />;

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CartDrawerProvider>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            {/* One page for every category; the old /products/tactical-footwear etc. URLs resolve here unchanged. */}
            <Route path="/products/:categorySlug" element={<Category />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success/:number" element={<CheckoutSuccess />} />
            <Route path="/checkout/failure/:number" element={<CheckoutFailure />} />
            <Route path="/checkout/pending/:number" element={<CheckoutPending />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account" element={guard(<AccountProfile />)} />
            <Route path="/account/orders" element={guard(<AccountOrders />)} />
            <Route path="/account/orders/:number" element={guard(<AccountOrderDetail />)} />
            <Route path="/account/addresses" element={guard(<AccountAddresses />)} />
            <Route path="/account/business" element={guard(<AccountBusiness />)} />
            <Route path="/legal" element={<LegalIndex />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/returns" element={<Returns />} />
            <Route path="/legal/shipping" element={<Shipping />} />
            <Route path="/legal/cancellation" element={<Cancellation />} />
            <Route path="/legal/contact" element={<LegalContact />} />
            <Route path="/admin/*" element={<AdminRoute />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </CartDrawerProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
