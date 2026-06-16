"use client";

import { useState } from "react";
import { site } from "@/content/site";
import SectionShell from "@/components/ui/SectionShell";
import FadeIn from "@/components/ui/FadeIn";

export default function FAQ() {
  const { faqs } = site;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SectionShell
      id={faqs.id}
      eyebrow={faqs.eyebrow}
      title={faqs.title}
      centered
      className="bg-cream-dark/40"
    >
      <div className="mx-auto max-w-3xl divide-y divide-charcoal/8 rounded-2xl border border-charcoal/8 bg-cream shadow-soft">
        {faqs.items.map((item, i) => {
          const open = openIndex === i;
          return (
            <FadeIn key={item.question} delay={i * 0.03}>
              <div>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  <span className="font-display text-base font-semibold text-charcoal md:text-lg">
                    {item.question}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-green/30 text-brand-green transition ${open ? "rotate-45" : ""}`}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                {open ? (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-charcoal/70 md:px-6 md:text-base">
                    {item.answer}
                  </p>
                ) : null}
              </div>
            </FadeIn>
          );
        })}
      </div>
    </SectionShell>
  );
}
