import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

async function enableMocks() {
  // Dynamic import keeps MSW out of the production bundle.
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
}

enableMocks().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
