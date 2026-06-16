"use client";

import { site } from "@/content/site";
import SectionShell from "@/components/ui/SectionShell";
import FadeIn from "@/components/ui/FadeIn";

export default function Differentiators() {
  const { differentiators } = site;

  return (
    <SectionShell
      id={differentiators.id}
      eyebrow={differentiators.eyebrow}
      title={differentiators.title}
      subtitle={differentiators.subtitle}
      centered
    >
      <div className="overflow-hidden rounded-2xl border border-charcoal/8 bg-cream shadow-card">
        <div className="grid grid-cols-3 border-b border-charcoal/8 bg-earth-green/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal/60 md:px-6">
          <span />
          <span className="text-center text-earth-green">Zeevan</span>
          <span className="text-center">Ordinary ghee</span>
        </div>
        {differentiators.items.map((item, i) => (
          <FadeIn key={item.title} delay={i * 0.03}>
            <div className="grid grid-cols-3 gap-2 border-b border-charcoal/6 px-4 py-4 last:border-0 md:gap-4 md:px-6 md:py-5">
              <p className="text-sm font-semibold text-charcoal md:text-base">{item.title}</p>
              <p className="text-center text-sm leading-relaxed text-charcoal/85 md:text-base">{item.ours}</p>
              <p className="text-center text-sm leading-relaxed text-charcoal/50 md:text-base">{item.ordinary}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </SectionShell>
  );
}
