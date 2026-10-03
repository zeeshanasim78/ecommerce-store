import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DiscountBadge, PriceTag } from "@/components/store/price-tag";
import { AddToCart } from "@/components/store/add-to-cart";
import { ProductGallery } from "@/components/store/product-gallery";
import { ScreenPlaceholder } from "@/components/store/screen-placeholder";
import { Badge, GradeBadge, StockBadge } from "@/components/ui/badge";
import { Container } from "@/components/ui/card";
import { formatMoney, paisa } from "@/lib/money";
import { readPaymentEnv } from "@/server/settings/payment-env";
import { getCheckoutSettings } from "@/server/settings/store-settings";
import { db } from "@/db/client";
import { getProductBySlug } from "@/server/storefront/catalog";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getProductBySlug((await params).slug);
  if (!product) return { title: "Screen not found" };
  return {
    title: `${product.brand} ${product.model} ${product.qualityGrade} screen`,
    description: `${product.displayType} display assembly for the ${product.brand} ${product.model}. ${product.warrantyDays}-day warranty, delivered across Pakistan.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProductBySlug((await params).slug);
  if (!product) notFound();
  const codMaxPaisa = readPaymentEnv().codMaxPaisa;
  const freeDelivery = getCheckoutSettings(db).prepaidFreeDelivery; // v1.12

  const specs: Array<[string, string]> = [
    ["Brand", product.brand],
    ["Model", product.model],
    ["Display type", product.displayType],
    ["Quality grade", product.qualityGrade],
    ["Fits model codes", product.compatibility.join(", ") || "Ask us to confirm"],
    ["Warranty", `${product.warrantyDays} days`],
  ];
  if (product.categoryName) specs.push(["Category", product.categoryName]);

  return (
    <Container className="py-12">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-midnight/65">
        <Link href="/store" className="hover:underline">
          Catalogue
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/store?brand=${product.brandSlug}`} className="hover:underline">
          {product.brand}
        </Link>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative">
          {product.images.length ? <ProductGallery images={product.images} /> : <ScreenPlaceholder brand={product.brand} model={product.model} className="rounded-bezel-lg" />}
          <DiscountBadge price={product.price} className="absolute top-4 left-4" />
        </div>

        <div>
          <p className="text-midnight/65">{product.brand}</p>
          <h1 className="mt-1 text-[2.25rem] leading-tight font-bold tracking-[-0.03em] md:text-[2.75rem]">{product.model}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <GradeBadge grade={product.qualityGrade} />
            <Badge>{product.displayType}</Badge>
            {product.featureTags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>

          <div className="mt-8 rounded-bezel bg-white p-6 ring-1 ring-midnight/8">
            <PriceTag price={product.price} size="lg" />
            {product.price.promotion?.bannerText ? <p className="mt-2 text-sm font-semibold text-terracotta">{product.price.promotion.bannerText}</p> : null}
            <p className="mt-2 text-sm text-midnight/70">
              {product.price.finalPaisa <= codMaxPaisa
                ? `Cash on delivery available${freeDelivery ? " · free delivery if you pay in advance" : ""}`
                : `Pay in advance by bank or wallet${freeDelivery ? " — free delivery" : ""} (cash on delivery up to ${formatMoney(paisa(codMaxPaisa))})`} · {product.warrantyDays}-day warranty
            </p>
            <div className="mt-6 border-t border-midnight/8 pt-6">
              {product.variants.length ? (
                <AddToCart variants={product.variants} lowThreshold={product.lowStockThreshold} productName={`${product.brand} ${product.model}`} />
              ) : (
                <StockBadge stock={0} lowThreshold={product.lowStockThreshold} />
              )}
            </div>
          </div>

          <dl className="mt-8 divide-y divide-midnight/8 rounded-bezel bg-white px-6 ring-1 ring-midnight/8">
            {specs.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 py-3.5 text-[0.9375rem]">
                <dt className="text-midnight/60">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {product.description ? <p className="mt-8 max-w-[65ch] leading-relaxed text-midnight/80">{product.description}</p> : null}
        </div>
      </div>
    </Container>
  );
}
