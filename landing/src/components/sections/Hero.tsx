"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { site } from "@/content/site";
import GoldHairline from "@/components/ui/GoldHairline";
import { motionTransition } from "@/lib/motion";

export default function Hero() {
  const { hero } = site;

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2 md:gap-16 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTransition}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">{hero.eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-charcoal md:text-5xl lg:text-[3.4rem]">
            {hero.headline}
          </h1>
          <GoldHairline className="mt-6" />
          <p className="mt-6 max-w-lg text-base leading-relaxed text-charcoal/75 md:text-lg">{hero.subline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={hero.primaryCta.href}
              className="rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-cream shadow-soft transition hover:bg-brand-green-deep"
            >
              {hero.primaryCta.label}
            </Link>
            <Link
              href={hero.secondaryCta.href}
              className="rounded-full border border-charcoal/15 bg-cream/60 px-6 py-3 text-sm font-semibold text-charcoal transition hover:border-earth-green/30 hover:text-earth-green"
            >
              {hero.secondaryCta.label}
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap gap-3">
            {hero.badges.map((badge) => (
              <li
                key={badge}
                className="rounded-full border border-brand-green/25 bg-cream px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-earth-green"
              >
                {badge}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...motionTransition, delay: 0.08 }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-gold/25 via-transparent to-brand-green-leaf/15 blur-2xl" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-charcoal/8 bg-gradient-to-br from-cream via-cream-dark to-brand-green-leaf/20 shadow-card">
            <Image
              src={hero.image}
              alt={hero.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
