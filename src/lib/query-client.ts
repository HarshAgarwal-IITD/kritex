import { QueryClient } from "@tanstack/react-query";

/** The browser's query cache. src/main.tsx fills it with the catalog data of a prerendered page. */
export const queryClient = new QueryClient();
