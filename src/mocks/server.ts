import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Node mock server for vitest. Wired up in src/test/setup.ts. */
export const server = setupServer(...handlers);
