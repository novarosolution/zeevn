"use client";

import { site } from "@/content/site";
import SectionShell from "@/components/ui/SectionShell";
import FadeIn from "@/components/ui/FadeIn";

export default function Testimonials() {
  const { testimonials } = site;

  if (!testimonials.items.length) return null;

  return (
    <SectionShell
      id={testimonials.id}
      eyebrow={testimonials.eyebrow}
      title={testimonials.title}
      centered
      className="bg-cream-dark/40"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.items.map((item, i) => (
          <FadeIn key={item.name} delay={i * 0.05}>
            <blockquote className="flex h-full flex-col rounded-2xl border border-charcoal/6 bg-cream p-6 shadow-soft">
              <p className="flex-1 text-sm leading-relaxed text-charcoal/80 md:text-base">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-6 border-t border-charcoal/6 pt-4">
                <cite className="not-italic">
                  <span className="block font-semibold text-charcoal">{item.name}</span>
                  <span className="text-sm text-charcoal/55">{item.location}</span>
                </cite>
              </footer>
            </blockquote>
          </FadeIn>
        ))}
      </div>
    </SectionShell>
  );
}
