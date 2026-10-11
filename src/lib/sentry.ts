import type { Breadcrumb, ErrorEvent } from "@sentry/react";

/** Drops ?query and #hash: reset-password links carry a token there. */
export const withoutQuery = (url: string) => url.split(/[?#]/)[0];

/** Keeps personal data out of reports: no query strings, cookies or headers. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    if (event.request.url) event.request.url = withoutQuery(event.request.url);
    delete event.request.query_string;
    delete event.request.cookies;
    delete event.request.headers;
  }
  return event;
}

export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb {
  const data = crumb.data;
  if (data) {
    for (const key of ["url", "from", "to"]) {
      if (typeof data[key] === "string") data[key] = withoutQuery(data[key]);
    }
  }
  return crumb;
}

/**
 * Error reporting (OPS). Off unless VITE_SENTRY_DSN is set at build time. The SDK is a separate chunk
 * fetched after the first render, so it adds nothing to the page's initial load. Errors only, no tracing
 * or session replay.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  void import("@sentry/react").then((Sentry) =>
    Sentry.init({
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
      release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-web-extension:\/\//],
      ignoreErrors: ["ResizeObserver loop"],
      beforeSend: scrubEvent,
      beforeBreadcrumb: scrubBreadcrumb,
    }),
  );
}
