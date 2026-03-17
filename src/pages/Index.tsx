import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import ClientsSection from "@/components/ClientsSection";
import CatalogSection from "@/components/CatalogSection";
import CapabilitiesSection from "@/components/CapabilitiesSection";
import CommitmentSection from "@/components/CommitmentSection";
import TimelineSection from "@/components/TimelineSection";
import HeritageSection from "@/components/HeritageSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsBar />
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
