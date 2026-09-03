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
import AchievementsSection from "@/components/AchievementsSection";
import PartnershipsSection from "@/components/PartnershipsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

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
      <Navbar />
      <HeroSection />
      <StatsBar />
      <AchievementsSection />
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
