import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { AdminHeader } from "@/components/admin/ui";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/db/client";
import { stockLedger, user } from "@/db/schema";
import { STOCK_TRANSACTION_TYPES } from "@/db/schema/inventory";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { requireStaff } from "@/server/dal";
import { MOVEMENT_LABEL, countLedger, listLedger, parseLedgerFilters, referenceLabel } from "@/server/inventory/ledger";

export const metadata = { title: "Stock ledger" };

const PAGE = 50;

type SP = Record<string, string | string[] | undefined>;

export default async function StockLedgerPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireStaff("ledger");
  const sp = await searchParams;
  const filters = parseLedgerFilters(sp);
  const pageNo = Math.max(1, Math.min(10_000, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1));
  const total = countLedger(db, filters);
  const rows = listLedger(db, filters, { limit: PAGE, offset: (pageNo - 1) * PAGE });
  const pages = Math.max(1, Math.ceil(total / PAGE));

  // Everyone who has ever moved stock, for the filter
  const operators = db.selectDistinct({ id: user.id, name: user.name }).from(stockLedger).innerJoin(user, eq(user.id, stockLedger.operatorId)).orderBy(asc(user.name)).all();

  const query = new URLSearchParams();
  for (const [k, v] of Object.entries({ q: filters.q, type: filters.type, operator: filters.operatorId, ref: filters.reference, from: filters.from, to: filters.to, variant: filters.variantId })) if (v) query.set(k, v);
  const pageLink = (n: number) => `/admin/stock-ledger?${new URLSearchParams([...query, ["page", String(n)]])}`;

  return (
    <>
      <AdminHeader
        title="Stock ledger"
        description="Every change to stock, in order. Rows are permanent: mistakes are fixed with a new adjustment, never by editing history."
        actions={
          <a href={`/admin/stock-ledger/export?${query}`} className={buttonClasses("outline")} download>
            Download CSV
          </a>
        }
      />

      <form className="mb-6 grid gap-4 rounded-bezel bg-white p-5 ring-1 ring-midnight/8 sm:grid-cols-2 lg:grid-cols-4" role="search">
        <Field id="q" label="Screen or SKU">
          <Input id="q" name="q" defaultValue={filters.q} placeholder="S23 Ultra, CA-SAM-…" />
        </Field>
        <Field id="type" label="Movement">
          <Select id="type" name="type" defaultValue={filters.type ?? ""}>
            <option value="">All movements</option>
            {STOCK_TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {MOVEMENT_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="operator" label="Done by">
          <Select id="operator" name="operator" defaultValue={filters.operatorId ?? ""}>
            <option value="">Anyone</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="ref" label="Reference" hint="PO or order number">
          <Input id="ref" name="ref" defaultValue={filters.reference} placeholder="PO-0007" />
        </Field>
        <Field id="from" label="From">
          <Input id="from" name="from" type="date" defaultValue={filters.from} />
        </Field>
        <Field id="to" label="To">
          <Input id="to" name="to" type="date" defaultValue={filters.to} />
        </Field>
        {filters.variantId ? <input type="hidden" name="variant" value={filters.variantId} /> : null}
        <div className="flex items-end gap-3 lg:col-span-2">
          <Button type="submit">Filter</Button>
          <ButtonLink href="/admin/stock-ledger" variant="ghost">
            Clear
          </ButtonLink>
        </div>
      </form>

      <p className="mb-3 text-sm text-midnight/70">
        {total.toLocaleString("en-PK")} movement{total === 1 ? "" : "s"}
        {filters.variantId ? " for one colour" : ""}
        {total > PAGE ? ` · page ${pageNo} of ${pages}` : ""}
      </p>

      {rows.length === 0 ? (
        <p className="text-midnight/70">No stock movements match.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>When</TH>
              <TH>Screen</TH>
              <TH>Movement</TH>
              <TH className="text-right">Change</TH>
              <TH className="text-right">Stock</TH>
              <TH>Reference</TH>
              <TH>By</TH>
            </tr>
          </THead>
          <tbody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="text-sm whitespace-nowrap text-midnight/80">{formatKarachi(r.timestamp)}</TD>
                <TD>
                  <Link href={`/admin/products/${r.productId}`} className="font-semibold hover:underline">
                    {r.brand} {r.model}
                  </Link>
                  <span className="block text-sm text-midnight/70">
                    {r.color}
                    {r.variantLabel ? ` (${r.variantLabel})` : ""} · <span className="tabular">{r.variantSku}</span>
                  </span>
                </TD>
                <TD>
                  {MOVEMENT_LABEL[r.type]}
                  {r.notes ? <span className="block max-w-xs text-sm text-midnight/65">{r.notes}</span> : null}
                </TD>
                <TD className={`tabular text-right font-semibold ${r.quantity < 0 ? "text-terracotta" : ""}`}>{r.quantity > 0 ? `+${r.quantity}` : r.quantity}</TD>
                <TD className="tabular text-right whitespace-nowrap text-midnight/80">
                  {r.previousStock} → <span className="font-semibold text-midnight">{r.newStock}</span>
                  {r.unitCostPaisa !== null ? <span className="block text-xs text-midnight/55">at {formatMoney(paisa(r.unitCostPaisa))}</span> : null}
                </TD>
                <TD className="tabular">
                  {r.poCode ? (
                    <Link href={`/admin/purchase-orders/${r.referenceId}`} className="hover:underline">
                      {r.poCode}
                    </Link>
                  ) : (
                    referenceLabel(r)
                  )}
                </TD>
                <TD className="text-sm">{r.operatorName ?? r.operatorId}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      {pages > 1 ? (
        <nav aria-label="Pages" className="mt-6 flex items-center gap-3">
          {pageNo > 1 ? (
            <ButtonLink href={pageLink(pageNo - 1)} variant="outline" size="sm">
              Newer
            </ButtonLink>
          ) : null}
          {pageNo < pages ? (
            <ButtonLink href={pageLink(pageNo + 1)} variant="outline" size="sm">
              Older
            </ButtonLink>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
