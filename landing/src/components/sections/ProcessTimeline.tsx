"use client";

import { site } from "@/content/site";
import SectionShell from "@/components/ui/SectionShell";
import FadeIn from "@/components/ui/FadeIn";
import ProcessIcon from "@/components/ui/ProcessIcon";

export default function ProcessTimeline() {
  const { process } = site;

  return (
    <SectionShell
      id={process.id}
      eyebrow={process.eyebrow}
      title={process.title}
      subtitle={process.subtitle}
      className="bg-cream-dark/40"
    >
      <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {process.steps.map((step, i) => (
          <FadeIn
            key={step.step}
            as="li"
            delay={i * 0.04}
            className="h-full rounded-2xl border border-charcoal/6 bg-cream p-6 shadow-soft"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-earth-green/10 text-earth-green">
                <ProcessIcon name={step.icon} className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-semibold text-brand-green">{step.step}</span>
            </div>
            <h3 className="font-display text-lg font-semibold text-charcoal">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{step.description}</p>
          </FadeIn>
        ))}
      </ol>
    </SectionShell>
  );
}
