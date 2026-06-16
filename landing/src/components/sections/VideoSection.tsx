"use client";

import { useState } from "react";
import Image from "next/image";
import { site } from "@/content/site";
import SectionShell from "@/components/ui/SectionShell";
import FadeIn from "@/components/ui/FadeIn";

export default function VideoSection() {
  const { video } = site;
  const [playing, setPlaying] = useState(false);
  const src = String(video.src || "").trim();
  const hasVideo = Boolean(src);

  if (!hasVideo) return null;

  const isYoutube = /youtube\.com|youtu\.be/.test(src);

  return (
    <SectionShell id="video" title={video.title} centered>
      <FadeIn>
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-charcoal/8 bg-charcoal shadow-card">
          {!playing ? (
            <button
              type="button"
              className="group relative block w-full text-left"
              onClick={() => setPlaying(true)}
              aria-label="Play video"
            >
              <div className="relative aspect-video w-full bg-charcoal">
                <Image
                  src={video.poster}
                  alt=""
                  fill
                  className="object-cover opacity-90 transition group-hover:opacity-100"
                  sizes="(max-width: 896px) 100vw, 896px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />
              </div>
              <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand-green/40 bg-brand-green/90 text-cream shadow-soft transition group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          ) : isYoutube ? (
            <div className="aspect-video w-full">
              <iframe
                src={`${src}?autoplay=1`}
                title={video.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video src={src} controls autoPlay className="aspect-video w-full" />
          )}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-charcoal/65 md:text-base">
          {video.caption}
        </p>
      </FadeIn>
    </SectionShell>
  );
}
