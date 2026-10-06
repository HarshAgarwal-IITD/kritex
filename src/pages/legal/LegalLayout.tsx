import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import Seo from "@/components/Seo";
import DraftBanner from "./DraftBanner";
import { LEGAL_DRAFT, LEGAL_LAST_UPDATED, policyByPath } from "./policies";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

/**
 * Typography for policy text. The Tailwind typography plugin isn't enabled in this project,
 * so these descendant styles give the same rhythm using the site's own fonts and colours.
 */
const proseClasses = [
  "max-w-3xl font-body text-sm md:text-[15px] leading-relaxed text-muted-foreground",
  "[&_h2]:font-display [&_h2]:text-sm md:[&_h2]:text-base [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-foreground [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-border",
  "[&_h3]:font-display [&_h3]:text-sm [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3",
  "[&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-2 [&_li]:pl-1",
  "[&_strong]:text-foreground [&_strong]:font-semibold",
  "[&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline",
  "[&_dl]:mb-4 [&_dt]:font-display [&_dt]:text-xs [&_dt]:uppercase [&_dt]:tracking-wider [&_dt]:text-foreground [&_dt]:mt-4 [&_dd]:mt-1",
].join(" ");

interface LegalLayoutProps {
  /** Route path of the page; title/description are looked up in ./policies.ts unless given. */
  path: string;
  title?: string;
  description?: string;
  /** Hide the "Last updated" line (used by the index page). */
  hideLastUpdated?: boolean;
  children: ReactNode;
}

const LegalLayout = ({ path, title, description, hideLastUpdated, children }: LegalLayoutProps) => {
  const meta = title && description ? { title, description } : policyByPath(path);
  const isIndex = path === "/legal";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo title={meta.title} description={meta.description} path={path} />
      <Navbar />

      <main className="flex-grow pt-32 pb-20">
        <div className="container">
          <Breadcrumbs
            items={
              isIndex
                ? [{ label: "Home", to: "/" }, { label: "Policies" }]
                : [{ label: "Home", to: "/" }, { label: "Policies", to: "/legal" }, { label: meta.title }]
            }
          />

          <header className="mb-10">
            <p className="font-display text-xs text-primary mb-3">Legal / Policies</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{meta.title}</h1>
            {!hideLastUpdated && (
              <p className="font-display text-xs text-muted-foreground">
                Last updated: <time dateTime={LEGAL_LAST_UPDATED}>{formatDate(LEGAL_LAST_UPDATED)}</time>
              </p>
            )}
          </header>

          {LEGAL_DRAFT && <DraftBanner />}

          <article className={proseClasses}>{children}</article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalLayout;
