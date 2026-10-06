/* eslint-disable react-refresh/only-export-components -- test helpers */
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

export const newQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

/** Exposes the current location for assertions. */
const LocationProbe = () => {
  const loc = useLocation();
  return <div data-testid="location">{`${loc.pathname}${loc.search}`}</div>;
};

/** Renders `ui` at `route` (matched by `path`) with React Query, Helmet and a router. */
export function renderRoute(ui: ReactElement, { route = "/", path = "*" }: { route?: string; path?: string } = {}) {
  const queryClient = newQueryClient();
  const utils = render(
    <HelmetProvider context={{}}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
            <Route path="*" element={<div>other route</div>} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
  return { ...utils, queryClient };
}
