'use client';

import { LandingHero } from './LandingHero';
import { TickerSection } from './TickerSection';
import { CTASection } from './CTASection';

export function LandingPage() {
  return (
    <main className="bg-slate-950 min-h-screen overflow-x-hidden">
      <LandingHero />
      <TickerSection />
      <CTASection />
    </main>
  );
}
