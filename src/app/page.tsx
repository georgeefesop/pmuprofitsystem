import React from 'react';
import HeroSection from '@/components/sections/HeroSection';
import ResultsSection from '@/components/sections/ResultsSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import TargetAudienceSection from '@/components/sections/TargetAudienceSection';
import FAQSection from '@/components/sections/FAQSection';

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ResultsSection />
      <FeaturesSection />
      <TargetAudienceSection />
      <FAQSection />
    </main>
  );
} 