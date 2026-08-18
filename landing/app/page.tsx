import AppShowcase from "@/components/AppShowcase";
import BodyMap from "@/components/BodyMap";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import IntelligenceEngine from "@/components/IntelligenceEngine";
import Nav from "@/components/Nav";
import Nutrition from "@/components/Nutrition";
import Problem from "@/components/Problem";
import Social from "@/components/Social";
import Transparency from "@/components/Transparency";
import YourControl from "@/components/YourControl";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <IntelligenceEngine />
        <YourControl />
        <BodyMap />
        <Nutrition />
        <Social />
        <Transparency />
        <AppShowcase />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
