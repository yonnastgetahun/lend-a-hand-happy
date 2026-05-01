import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Solution from "@/components/landing/Solution";
import HowItWorks from "@/components/landing/HowItWorks";
import MicroStory from "@/components/landing/MicroStory";
import Values from "@/components/landing/Values";

import EarlyAccess from "@/components/landing/EarlyAccess";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <MicroStory />
      <Values />
      
      <EarlyAccess />
      <Footer />
    </main>
  );
};

export default Index;
