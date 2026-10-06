import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import Breadcrumbs from "@/components/Breadcrumbs";

/** Placeholder for storefront routes that ship in a later stage (account, cart). */
const ComingSoon = ({ title }: { title: string }) => {
  const { pathname } = useLocation();
  return (
  <div className="min-h-screen bg-background flex flex-col">
    <Seo title={title} description="Online ordering for Kritex is coming soon." path={pathname} noindex />
    <Navbar />
    <main className="flex-grow pt-32 pb-20">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: title }]} />
        <p className="font-display text-xs text-primary mb-3">Coming Soon</p>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{title}</h1>
        <p className="font-body text-muted-foreground text-sm max-w-lg mb-8">
          Online ordering and customer accounts are on their way. Until then, browse the catalog and send us a
          procurement enquiry.
        </p>
        <Link
          to="/products"
          className="font-display text-xs bg-primary text-primary-foreground px-4 py-2 inline-block hover:bg-primary/90 transition-colors duration-300"
        >
          Browse All Products
        </Link>
      </div>
    </main>
    <Footer />
  </div>
  );
};

export default ComingSoon;
