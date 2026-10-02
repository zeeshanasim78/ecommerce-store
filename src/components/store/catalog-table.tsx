import Link from "next/link";
import { GradeBadge, StockBadge } from "@/components/ui/badge";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import type { CatalogCard } from "@/server/storefront/catalog";
import { PriceTag } from "./price-tag";

/** Dense spec-table view for repair shops (spec §0.3.5). On phones grade and stock tuck under the model. */
export function CatalogTable({ products }: { products: CatalogCard[] }) {
  return (
    <Table>
      <THead>
        <tr>
          <TH>Model</TH>
          <TH className="hidden md:table-cell">Panel</TH>
          <TH className="hidden md:table-cell">Grade</TH>
          <TH className="hidden lg:table-cell">Colours</TH>
          <TH className="hidden md:table-cell">Availability</TH>
          <TH className="text-right">Price</TH>
        </tr>
      </THead>
      <tbody>
        {products.map((p) => (
          <TR key={p.id}>
            <TD>
              <span className="block text-sm text-midnight/60">{p.brand}</span>
              <Link href={`/store/${p.slug}`} className="font-semibold hover:underline">
                {p.model}
              </Link>
              <span className="mt-2.5 flex flex-wrap gap-1.5 md:hidden">
                <GradeBadge grade={p.qualityGrade} />
                <StockBadge stock={p.totalStock} lowThreshold={p.lowStockThreshold} />
              </span>
            </TD>
            <TD className="hidden whitespace-nowrap text-midnight/80 md:table-cell">{p.displayType}</TD>
            <TD className="hidden md:table-cell">
              <GradeBadge grade={p.qualityGrade} className="whitespace-nowrap" />
            </TD>
            <TD className="hidden text-midnight/80 lg:table-cell">{p.variants.map((v) => v.color).join(", ")}</TD>
            <TD className="hidden md:table-cell">
              <StockBadge stock={p.totalStock} lowThreshold={p.lowStockThreshold} />
            </TD>
            <TD className="text-right align-top md:align-middle">
              <PriceTag price={p.price} className="justify-end whitespace-nowrap" />
            </TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}
