export default function GoldHairline({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-px w-full max-w-xs bg-gradient-to-r from-transparent via-brand-gold/55 to-transparent ${className}`}
      aria-hidden
    />
  );
}
