import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";
import { afterAll, afterEach } from "vitest";
import { server } from "@/mocks/server";
import { resetMockDb } from "@/mocks/handlers";

// Listen at setup time (not in beforeAll): openapi-fetch captures globalThis.fetch when the
// client module is imported, so MSW must patch fetch before any test file imports it.
server.listen({ onUnhandledRequest: "error" });
// findBy*/waitFor default to 1 s, which flakes under load (CI, parallel workers).
configure({ asyncUtilTimeout: 5_000 });
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

// Node 22+ ships a file-less `localStorage` global without methods, which shadows jsdom's.
// Give tests a working in-memory Storage, emptied after each test.
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
}
const memoryStorage = new MemoryStorage();
Object.defineProperty(window, "localStorage", { configurable: true, writable: true, value: memoryStorage });
Object.defineProperty(globalThis, "localStorage", { configurable: true, writable: true, value: memoryStorage });
afterEach(() => memoryStorage.clear());
