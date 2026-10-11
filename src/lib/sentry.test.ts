import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/react";
import { scrubBreadcrumb, scrubEvent, withoutQuery } from "./sentry";

describe("sentry scrubbing", () => {
  it("drops query strings and hashes (reset-password tokens)", () => {
    expect(withoutQuery("https://www.kritex.in/reset-password?token=abc#x")).toBe("https://www.kritex.in/reset-password");
    expect(withoutQuery("/products")).toBe("/products");
  });

  it("removes the URL query, cookies and headers from error events", () => {
    const event = scrubEvent({
      type: undefined,
      request: {
        url: "https://www.kritex.in/reset-password?token=secret",
        query_string: "token=secret",
        cookies: { session: "secret" },
        headers: { "User-Agent": "x" },
      },
    } as ErrorEvent);
    expect(JSON.stringify(event)).not.toContain("secret");
    expect(event.request?.url).toBe("https://www.kritex.in/reset-password");
  });

  it("removes query strings from navigation and fetch breadcrumbs", () => {
    expect(scrubBreadcrumb({ category: "navigation", data: { from: "/a?token=1", to: "/b?q=2" } }).data).toEqual({
      from: "/a",
      to: "/b",
    });
    expect(scrubBreadcrumb({ category: "fetch", data: { url: "/api/v1/x?token=1", status_code: 500 } }).data).toEqual({
      url: "/api/v1/x",
      status_code: 500,
    });
  });
});
