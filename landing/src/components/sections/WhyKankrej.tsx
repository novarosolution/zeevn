"use client";

import Image from "next/image";
import { site } from "@/content/site";
import SectionShell from "@/components/ui/SectionShell";
import FadeIn from "@/components/ui/FadeIn";

export default function WhyKankrej() {
  const { whyKankrej } = site;

  return (
    <SectionShell
      id={whyKankrej.id}
      eyebrow={whyKankrej.eyebrow}
      title={whyKankrej.title}
      subtitle={whyKankrej.subtitle}
      className="bg-cream-dark/40"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <FadeIn>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-charcoal/8 bg-gradient-to-br from-cream to-brand-green-leaf/15 shadow-card">
            <Image
              src={whyKankrej.image}
              alt={whyKankrej.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </FadeIn>
        <FadeIn delay={0.06}>
          <div className="space-y-4 text-base leading-relaxed text-charcoal/75">
            {whyKankrej.body.map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>
        </FadeIn>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {whyKankrej.stats.map((stat, i) => (
          <FadeIn key={stat.value} delay={i * 0.05}>
            <article className="rounded-2xl border border-brand-green/20 bg-cream p-6 shadow-soft">
              <p className="font-display text-2xl font-semibold text-earth-green">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-brand-green">{stat.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{stat.description}</p>
            </article>
          </FadeIn>
        ))}
      </div>
    </SectionShell>
  );
}
