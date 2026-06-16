"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { site } from "@/content/site";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { brand, nav } = site;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-250 ${
        scrolled
          ? "border-b border-charcoal/5 bg-cream/95 shadow-[0_8px_30px_-20px_rgba(33,27,18,0.25)] backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link
          href="#"
          className="font-display bg-gradient-to-r from-charcoal via-brand-green-deep to-brand-gold bg-clip-text text-xl font-semibold tracking-tight text-transparent"
        >
          {brand.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {nav.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-charcoal/75 transition-colors hover:text-earth-green"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="#order"
            className="hidden rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-cream shadow-soft transition hover:bg-brand-green-deep md:inline-flex"
          >
            {nav.cta}
          </Link>
          <button
            type="button"
            className="inline-flex flex-col justify-center gap-1 rounded-lg border border-charcoal/10 p-2 md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block h-0.5 w-5 bg-charcoal" />
            <span className="block h-0.5 w-5 bg-charcoal" />
            <span className="block h-0.5 w-5 bg-charcoal" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-charcoal/5 bg-cream px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {nav.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-charcoal/80"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#order"
              className="mt-2 inline-flex rounded-full bg-brand-green px-5 py-2.5 text-center text-sm font-semibold text-cream"
              onClick={() => setOpen(false)}
            >
              {nav.cta}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
