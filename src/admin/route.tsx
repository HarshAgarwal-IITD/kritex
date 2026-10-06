import { lazy, Suspense } from "react";

// The admin app is its own chunk: nothing under src/admin is imported eagerly by the storefront.
const AdminApp = lazy(() => import("./AdminApp"));

export const AdminRoute = () => (
  <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
    <AdminApp />
  </Suspense>
);
