import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type Module<T> = { default: T };

export type PreloadableComponent<T extends ComponentType<never>> = LazyExoticComponent<T> & {
  /** Downloads the chunk; afterwards the component renders without suspending. */
  preload: () => Promise<void>;
};

/**
 * React.lazy that can be loaded ahead of rendering. A prerendered page must have its lazy chunks loaded
 * before React hydrates it (src/main.tsx): a Suspense boundary still waiting for its chunk when the
 * session or cart data arrives is thrown away and re-rendered from scratch (React error #421).
 */
export function lazyPage<T extends ComponentType<never>>(load: () => Promise<Module<T>>): PreloadableComponent<T> {
  let loaded: Module<T> | undefined;
  const preload = () =>
    load().then((mod) => {
      loaded = mod;
    });
  // An already-loaded module is handed over through a synchronous thenable, which React.lazy resolves
  // on the spot instead of suspending for a tick.
  const Component = lazy(() =>
    loaded
      ? ({ then: (resolve: (mod: Module<T>) => void) => resolve(loaded!) } as unknown as Promise<Module<T>>)
      : load().then((mod) => (loaded = mod)),
  );
  return Object.assign(Component, { preload });
}
