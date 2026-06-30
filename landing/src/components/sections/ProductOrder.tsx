"use client";

import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";
import SectionShell from "@/components/ui/SectionShell";
import FadeIn from "@/components/ui/FadeIn";

const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL || "https://www.zeevan.app";

function buildOrderLinks(product: (typeof site.products.items)[number], brand: typeof site.brand) {
  const whatsapp = String(brand.whatsapp || "").trim();
  const message = `Hi, I'd like to order Zeevan ghee ${product.size}.`;
  const buyMessage = `Order ${product.size} - ${product.price}`;

  if (whatsapp) {
    const waBase = `https://wa.me/${whatsapp}?text=`;
    return {
      primaryHref: `${waBase}${encodeURIComponent(message)}`,
      primaryExternal: true,
      secondaryHref: `${waBase}${encodeURIComponent(buyMessage)}`,
      secondaryExternal: true,
    };
  }

  const email = String(brand.email || "support@zeevan.app").trim();
  const subject = encodeURIComponent(`Zeevan ghee order — ${product.size}`);
  const body = encodeURIComponent(message);
  return {
    primaryHref: `mailto:${email}?subject=${subject}&body=${body}`,
    primaryExternal: false,
    secondaryHref: SHOP_URL,
    secondaryExternal: true,
  };
}

export default function ProductOrder() {
  const { products, brand } = site;

  return (
    <SectionShell
      id={products.id}
      eyebrow={products.eyebrow}
      title={products.title}
      subtitle={products.subtitle}
      centered
    >
      <div className="grid gap-6 md:grid-cols-3">
        {products.items.map((product, i) => {
          const links = buildOrderLinks(product, brand);
          return (
          <FadeIn key={product.id} delay={i * 0.05}>
            <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-charcoal/8 bg-cream shadow-card">
              {product.badge ? (
                <span className="absolute right-4 top-4 z-10 rounded-full bg-earth-green px-3 py-1 text-xs font-semibold text-cream">
                  {product.badge}
                </span>
              ) : null}
              <div className="relative aspect-square bg-gradient-to-br from-cream to-brand-green-leaf/15">
                <Image
                  src={product.image}
                  alt={`Zeevan ghee ${product.size}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-xl font-semibold text-charcoal">{product.size}</h3>
                <p className="mt-1 font-display text-2xl font-semibold text-brand-green">{product.price}</p>
                {product.priceNote ? (
                  <p className="text-sm text-charcoal/55">{product.priceNote}</p>
                ) : null}
                <div className="mt-auto flex flex-col gap-2 pt-6">
                  <Link
                    href={links.primaryHref}
                    target={links.primaryExternal ? "_blank" : undefined}
                    rel={links.primaryExternal ? "noopener noreferrer" : undefined}
                    className="rounded-full border border-earth-green/30 px-4 py-2.5 text-center text-sm font-semibold text-earth-green transition hover:bg-earth-green/5"
                  >
                    {String(brand.whatsapp || "").trim() ? products.whatsappCta : "Email to order"}
                  </Link>
                  <Link
                    href={links.secondaryHref}
                    target={links.secondaryExternal ? "_blank" : undefined}
                    rel={links.secondaryExternal ? "noopener noreferrer" : undefined}
                    className="rounded-full bg-brand-green px-4 py-2.5 text-center text-sm font-semibold text-cream shadow-soft transition hover:bg-brand-green-deep"
                  >
                    {String(brand.whatsapp || "").trim() ? products.buyCta : "Shop on zeevan.app"}
                  </Link>
                </div>
              </div>
            </article>
          </FadeIn>
          );
        })}
      </div>
    </SectionShell>
  );
}
