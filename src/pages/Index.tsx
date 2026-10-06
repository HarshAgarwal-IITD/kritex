import { useEffect } from "react";
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
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import Seo, { SITE_URL } from "@/components/Seo";

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
      <Seo
        title="Defence & Industrial Supply"
        description="Kritex engineers defence-grade apparel, tactical footwear and field equipment for the armed forces of India and Bhutan since 1976."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Kritex",
          url: SITE_URL,
          logo: `${SITE_URL}/brand/logo_flower.png`,
          email: "procurement@kritex.in",
          foundingDate: "1976",
        }}
      />
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
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
