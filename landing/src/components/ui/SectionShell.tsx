import GoldHairline from "./GoldHairline";
import FadeIn from "./FadeIn";

type SectionShellProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
};

export default function SectionShell({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
  centered = false,
}: SectionShellProps) {
  return (
    <section id={id} className={`py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn className={centered ? "mx-auto mb-12 max-w-2xl text-center" : "mb-12 max-w-2xl"}>
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-green">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-3xl font-semibold tracking-tight text-charcoal md:text-4xl lg:text-[2.6rem] lg:leading-tight">
            {title}
          </h2>
          <GoldHairline className={`mt-5 ${centered ? "mx-auto" : ""}`} />
          {subtitle ? (
            <p className="mt-5 text-base leading-relaxed text-charcoal/70 md:text-lg">{subtitle}</p>
          ) : null}
        </FadeIn>
        {children}
      </div>
    </section>
  );
}
