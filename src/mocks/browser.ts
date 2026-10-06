import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** Dev-only mock worker. Started from main.tsx when VITE_USE_MOCKS === "true". */
export const worker = setupWorker(...handlers);
