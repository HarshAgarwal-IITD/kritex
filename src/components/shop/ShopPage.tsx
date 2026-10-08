import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";
import { cn } from "@/lib/utils";
import { eyebrowClass } from "./styles";

interface ShopPageProps {
  title: string;
  /** Small label above the heading (e.g. "Checkout"). */
  eyebrow?: string;
  description?: string;
  crumbs?: Crumb[];
  /** Hide the big page heading (the content renders its own). */
  hideHeading?: boolean;
  className?: string;
  children: ReactNode;
}

/** Page shell for cart/checkout/account pages: same Navbar, spacing, breadcrumbs and heading style as the catalog pages. */
const ShopPage = ({ title, eyebrow, description, crumbs, hideHeading, className, children }: ShopPageProps) => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo title={title} description={description ?? `${title} — Kritex`} path={pathname} noindex />
      <Navbar />
      <main className="flex-grow pt-32 pb-20">
        <div className={cn("container", className)}>
          <Breadcrumbs items={crumbs ?? [{ label: "Home", to: "/" }, { label: title }]} />
          {!hideHeading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
              className="mb-10"
            >
              {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">{title}</h1>
            </motion.div>
          )}
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShopPage;
