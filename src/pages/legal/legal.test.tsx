import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Footer from "@/components/Footer";
import LegalIndex from "./LegalIndex";
import Terms from "./Terms";
import Privacy from "./Privacy";
import Returns from "./Returns";
import Shipping from "./Shipping";
import Cancellation from "./Cancellation";
import Contact from "./Contact";
import { policies } from "./policies";

const routes = [
  { path: "/legal", element: <LegalIndex />, heading: "Policies" },
  { path: "/legal/terms", element: <Terms />, heading: "Terms & Conditions" },
  { path: "/legal/privacy", element: <Privacy />, heading: "Privacy Policy" },
  { path: "/legal/returns", element: <Returns />, heading: "Refund & Returns Policy" },
  { path: "/legal/shipping", element: <Shipping />, heading: "Shipping Policy" },
  { path: "/legal/cancellation", element: <Cancellation />, heading: "Cancellation Policy" },
  { path: "/legal/contact", element: <Contact />, heading: "Contact & Grievance Officer" },
];

const renderAt = (path: string) =>
  render(
    <HelmetProvider context={{}}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );

describe("legal pages", () => {
  it.each(routes)("$path renders its heading, the draft banner and SEO title", async ({ path, heading }) => {
    renderAt(path);
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByTestId("legal-draft-banner")).toHaveTextContent("Draft — pending legal review");
    await waitFor(() => expect(document.title).toBe(`${heading} | Kritex`));
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://kritex.in${path}`);
  });

  it("policy pages show the last-updated date", () => {
    renderAt("/legal/terms");
    expect(screen.getByText("6 October 2026").closest("time")).toHaveAttribute("dateTime", "2026-10-06");
  });

  it("the index lists every policy", () => {
    renderAt("/legal");
    const article = screen.getByRole("article");
    for (const p of policies) {
      expect(within(article).getByRole("link", { name: new RegExp(p.title) })).toHaveAttribute("href", p.path);
    }
  });
});

describe("Footer", () => {
  it("links to every policy page", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Policies" });
    expect(within(nav).getByRole("link", { name: "Policies" })).toHaveAttribute("href", "/legal");
    for (const p of policies) {
      expect(within(nav).getByRole("link", { name: p.label })).toHaveAttribute("href", p.path);
    }
  });
});
