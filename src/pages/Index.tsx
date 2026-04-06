import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import RouteMapSection from "@/components/RouteMapSection";
import StatsSection from "@/components/StatsSection";
import TechnologySection from "@/components/TechnologySection";
import TerminologySection from "@/components/TerminologySection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <RouteMapSection />
      <StatsSection />
      <TechnologySection />
      <TerminologySection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
