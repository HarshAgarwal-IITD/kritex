/* eslint-disable react-refresh/only-export-components -- test helpers */
import { render } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, useLocation } from "react-router-dom";
import { vi } from "vitest";
import { AppRoutes } from "@/App";
import { newQueryClient } from "@/features/catalog/test-utils";
import { resetAdminMockDb, setMockSession } from "@/mocks/admin-handlers";
import { resetCommerceMockDb } from "@/mocks/commerce-handlers";

const LocationProbe = () => {
  const loc = useLocation();
  return <div data-testid="location">{`${loc.pathname}${loc.search}`}</div>;
};

/** Renders the whole storefront (all routes + cart drawer) at `route`, against the MSW mocks. */
export function renderApp(route = "/") {
  const queryClient = newQueryClient();
  const utils = render(
    <HelmetProvider context={{}}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AppRoutes />
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
  return { ...utils, queryClient };
}

/** Fresh mock users/session + commerce data; optionally sign in as a mock user. */
export function resetMocks(signedInAs: string | null = null) {
  resetAdminMockDb();
  resetCommerceMockDb();
  setMockSession(signedInAs);
  // jsdom has no scrollTo (framer-motion / mobile menu).
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
}

export const SHIRT_M = "var_full-sleeve-combat-tshirt_M";
export const SHIRT_L = "var_full-sleeve-combat-tshirt_L";
export const SHIRT_XXL = "var_full-sleeve-combat-tshirt_XXL";
export const SHIRT_PRICE = 129900;
