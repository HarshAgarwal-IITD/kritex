import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, matchPath, Route, Routes, useLocation, useNavigationType } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LazyMotion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index, { preloadIndex } from "./pages/Index.tsx";
import { AdminRoute } from "./admin/route";
import { CartDrawerProvider } from "./features/cart/components/CartDrawer";
import RequireAuth from "./features/account/components/RequireAuth";
import { PageLoader } from "@/components/shop/Loaders";
import { queryClient } from "@/lib/query-client";
import { lazyPage } from "@/lib/lazy-page";

// Checkout, auth and account pages are split out of the main bundle.
// Only the home page is in the entry bundle; every other route loads on first visit.
const NotFound = lazyPage(() => import("./pages/NotFound.tsx"));
const Products = lazyPage(() => import("./pages/Products.tsx"));
const Category = lazyPage(() => import("./pages/Category.tsx"));
const ProductDetail = lazyPage(() => import("./pages/ProductDetail.tsx"));
const LegalIndex = lazyPage(() => import("./pages/legal/LegalIndex.tsx"));
const Terms = lazyPage(() => import("./pages/legal/Terms.tsx"));
const Privacy = lazyPage(() => import("./pages/legal/Privacy.tsx"));
const Returns = lazyPage(() => import("./pages/legal/Returns.tsx"));
const Shipping = lazyPage(() => import("./pages/legal/Shipping.tsx"));
const Cancellation = lazyPage(() => import("./pages/legal/Cancellation.tsx"));
const LegalContact = lazyPage(() => import("./pages/legal/Contact.tsx"));
const CartPage = lazy(() => import("./pages/Cart.tsx"));
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
const AccountQuotes = lazy(() => import("./pages/account/Quotes.tsx"));
const AccountQuoteDetail = lazy(() => import("./pages/account/QuoteDetail.tsx"));
const QuotePage = lazy(() => import("./pages/Quote.tsx"));
const TrackLookup = lazy(() => import("./pages/Track.tsx").then((m) => ({ default: m.TrackLookup })));
const TrackOrder = lazy(() => import("./pages/Track.tsx").then((m) => ({ default: m.TrackOrder })));

const guard = (el: JSX.Element) => <RequireAuth>{el}</RequireAuth>;

/** The prerendered routes (scripts/prerender.mjs) and the lazy chunks each one renders. */
const prerenderedRoutes: [path: string, preload: () => Promise<unknown>][] = [
  ["/", preloadIndex],
  ["/products", Products.preload],
  ["/products/:categorySlug", Category.preload],
  ["/product/:id", ProductDetail.preload],
  ["/legal", LegalIndex.preload],
  ["/legal/terms", Terms.preload],
  ["/legal/privacy", Privacy.preload],
  ["/legal/returns", Returns.preload],
  ["/legal/shipping", Shipping.preload],
  ["/legal/cancellation", Cancellation.preload],
  ["/legal/contact", LegalContact.preload],
];

/** Loads the lazy chunks of the page at `pathname`, so hydrating its prerendered HTML never suspends. */
// eslint-disable-next-line react-refresh/only-export-components
export const preloadRoute = async (pathname: string) => {
  const route = prerenderedRoutes.find(([path]) => matchPath(path, pathname));
  await route?.[1]();
};

/** Blank page-height placeholder while a lazy route loads (keeps the dark background, no layout jump). */
const RouteFallback = PageLoader;

/**
 * The router keeps the previous page's scroll offset, so a link clicked mid-page opened the next
 * page scrolled down. Reset to the top on every new navigation; back/forward (POP) and #hash links
 * keep their own scroll behaviour.
 */
// useLayoutEffect warns during the build-time prerender (no DOM there); the effect only matters in the browser.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  useBrowserLayoutEffect(() => {
    if (navType !== "POP" && !hash) window.scrollTo(0, 0);
  }, [pathname, hash, navType]);
  return null;
};

/** Every route plus the cart drawer. Exported so tests can mount it inside a MemoryRouter. */
export const AppRoutes = () => (
  <CartDrawerProvider>
    <ScrollToTop />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/products" element={<Products />} />
        {/* One page for every category; the old /products/tactical-footwear etc. URLs resolve here unchanged. */}
        <Route path="/products/:categorySlug" element={<Category />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={guard(<Checkout />)} />
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
        <Route path="/account/quotes" element={guard(<AccountQuotes />)} />
        <Route path="/account/quotes/:number" element={guard(<AccountQuoteDetail />)} />
        <Route path="/quote" element={<QuotePage />} />
        <Route path="/track" element={guard(<TrackLookup />)} />
        <Route path="/track/:orderNumber" element={guard(<TrackOrder />)} />
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
);

/** framer-motion's animation features, fetched after the first render (components use `m`, not `motion`). */
const motionFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

/**
 * Everything around the router. Shared with the build-time prerender (src/seo/prerender.tsx), which
 * renders the same tree with a StaticRouter, so the HTML it writes matches what the browser hydrates.
 */
export const AppProviders = ({ client, children }: { client: QueryClient; children: JSX.Element }) => (
  <HelmetProvider>
    <QueryClientProvider client={client}>
      <LazyMotion features={motionFeatures} strict>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </LazyMotion>
    </QueryClientProvider>
  </HelmetProvider>
);

const App = () => (
  <AppProviders client={queryClient}>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AppProviders>
);

export default App;
