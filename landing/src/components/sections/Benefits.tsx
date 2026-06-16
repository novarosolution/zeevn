"use client";

import { site } from "@/content/site";
import SectionShell from "@/components/ui/SectionShell";
import FadeIn from "@/components/ui/FadeIn";
import ProcessIcon from "@/components/ui/ProcessIcon";

export default function Benefits() {
  const { benefits } = site;

  return (
    <SectionShell id={benefits.id} eyebrow={benefits.eyebrow} title={benefits.title} centered>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.items.map((item, i) => (
          <FadeIn key={item.title} delay={i * 0.04}>
            <article className="h-full rounded-2xl border border-charcoal/6 bg-cream p-6 shadow-soft transition hover:border-brand-green/25">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/12 text-brand-green">
                <ProcessIcon name={item.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-charcoal">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{item.description}</p>
            </article>
          </FadeIn>
        ))}
      </div>
    </SectionShell>
  );
}
