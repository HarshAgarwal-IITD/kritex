import "@testing-library/jest-dom";
import { afterAll, afterEach } from "vitest";
import { server } from "@/mocks/server";
import { resetMockDb } from "@/mocks/handlers";

// Listen at setup time (not in beforeAll): openapi-fetch captures globalThis.fetch when the
// client module is imported, so MSW must patch fetch before any test file imports it.
server.listen({ onUnhandledRequest: "error" });
afterEach(() => {
  server.resetHandlers();
  resetMockDb();
});
afterAll(() => server.close());

// jsdom has no IntersectionObserver (framer-motion's whileInView needs it).
class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
Object.defineProperty(window, "IntersectionObserver", { writable: true, value: IntersectionObserverStub });
Object.defineProperty(globalThis, "IntersectionObserver", { writable: true, value: IntersectionObserverStub });

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
