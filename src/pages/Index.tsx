import { Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import ClientsSection from "@/components/ClientsSection";
import CatalogSection from "@/components/CatalogSection";
import CapabilitiesSection from "@/components/CapabilitiesSection";
import CommitmentSection from "@/components/CommitmentSection";
import TimelineSection from "@/components/TimelineSection";
import HeritageSection from "@/components/HeritageSection";
import PartnershipsSection from "@/components/PartnershipsSection";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { homeSeo } from "@/seo/pages";
import { lazyPage } from "@/lib/lazy-page";

const ContactSection = lazyPage(() => import("@/components/ContactSection"));

/** The home page's lazy chunks (hydrating the prerendered page needs them loaded first). */
// eslint-disable-next-line react-refresh/only-export-components
export const preloadIndex = ContactSection.preload;

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <Seo {...homeSeo()} />
      <Navbar />
      <HeroSection />
      <StatsBar />
      <PartnershipsSection />
      <ClientsSection />
      <CatalogSection />
      <CapabilitiesSection />
      <CommitmentSection />
      <TimelineSection />
      <HeritageSection />
      {/* Last section; lazy so the form libraries (react-hook-form, zod) stay out of the entry bundle. */}
      <Suspense fallback={null}>
        <ContactSection />
      </Suspense>
      <Footer />
    </div>
  );
};

export default Index;
