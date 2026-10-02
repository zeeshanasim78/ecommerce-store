import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, GradeBadge, StockBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Container, SectionDark } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { formatMoney, paisa } from "@/lib/money";

export const metadata: Metadata = { title: "UI kit", robots: { index: false, follow: false } };

const SWATCHES = [
  ["Midnight", "bg-midnight", "#0B1C33", "Headings, primary buttons, dark panels"],
  ["Terracotta", "bg-terracotta", "#A52A2A", "Checkout urgency, active and destructive states"],
  ["Amber", "bg-amber", "#D97706", "Quality-grade badges"],
  ["Canvas", "bg-canvas", "#FBF8F1", "Page background"],
  ["Surface", "bg-surface", "#F6EFE5", "Section bands, sidebars"],
  ["White", "bg-white", "#FFFFFF", "Cards and dialogs"],
] as const;

/** Visual checklist for Milestone 2. Only available in development. */
export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="pb-24">
      <Container className="py-14">
        <h1 className="text-display font-bold">Caidea UI kit</h1>
        <p className="mt-3 max-w-xl text-midnight/70">
          Every primitive in the brand palette. Development only — this page returns 404 in production.
        </p>
      </Container>

      <Container className="flex flex-col gap-16">
        <section>
          <h2 className="text-2xl font-bold">Colour tokens</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SWATCHES.map(([name, cls, hex, use]) => (
              <Card key={name} className="overflow-hidden">
                <div className={`h-20 ${cls} border-b border-midnight/8`} />
                <div className="p-4">
                  <p className="font-semibold">
                    {name} <span className="tabular font-medium text-midnight/60">{hex}</span>
                  </p>
                  <p className="mt-1 text-sm text-midnight/70">{use}</p>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-4 rounded-bezel-sm bg-white p-4 ring-1 ring-midnight/8">
            <div className="size-10 rounded-full bg-blue-500 ring-1 ring-midnight/20" />
            <p className="text-sm text-midnight/70">
              This circle uses <code className="font-semibold">bg-blue-500</code>. It has no fill because Tailwind’s
              default palette is switched off — only Caidea tokens exist.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Typography</h2>
          <div className="mt-6 flex flex-col gap-4">
            <p className="font-display text-display font-bold">Epilogue display 700</p>
            <p className="font-display text-3xl font-semibold">Epilogue heading 600</p>
            <p className="max-w-[65ch] text-lg leading-relaxed">
              Plus Jakarta Sans body. Dynamic AMOLED 2X, 6.8 inch, 120 Hz, fits SM-S918B. Prices use tabular figures:{" "}
              <span className="tabular font-semibold">{formatMoney(paisa(6_800_000))}</span>.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Buttons</h2>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button>Add to cart</Button>
            <Button variant="urgent">Place order</Button>
            <Button variant="outline">Save draft</Button>
            <Button variant="ghost">Cancel</Button>
            <Button disabled>Out of stock</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
          <SectionDark className="mt-6 rounded-bezel p-6">
            <Button variant="inverse">Inverse on midnight</Button>
          </SectionDark>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Badges</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <GradeBadge grade="OEM Original" />
            <GradeBadge grade="OLED A Grade" />
            <GradeBadge grade="Compatible A Grade" />
            <StockBadge stock={12} lowThreshold={5} />
            <StockBadge stock={2} lowThreshold={5} />
            <StockBadge stock={0} lowThreshold={5} />
            <Badge>With Frame</Badge>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Form fields</h2>
          <div className="mt-6 grid max-w-2xl gap-5 sm:grid-cols-2">
            <Field id="phone" label="Mobile number" hint="We’ll call this number before delivery.">
              <Input id="phone" type="tel" placeholder="0300 1234567" aria-describedby="phone-hint" />
            </Field>
            <Field id="city" label="City">
              <Select id="city" defaultValue="Lahore">
                <option>Lahore</option>
                <option>Karachi</option>
                <option>Islamabad</option>
              </Select>
            </Field>
            <Field id="tid" label="Transaction ID" error="Enter the 11-digit ID from your JazzCash SMS.">
              <Input id="tid" defaultValue="12345" aria-invalid="true" aria-describedby="tid-error" />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Spec table</h2>
          <div className="mt-6">
            <Table>
              <THead>
                <tr>
                  <TH>Model</TH>
                  <TH>Panel</TH>
                  <TH>Grade</TH>
                  <TH className="text-right">Price</TH>
                </tr>
              </THead>
              <tbody>
                <TR>
                  <TD className="font-semibold">Galaxy S23 Ultra</TD>
                  <TD>Dynamic AMOLED 2X</TD>
                  <TD>
                    <GradeBadge grade="OEM Original" />
                  </TD>
                  <TD className="tabular text-right font-semibold">{formatMoney(paisa(6_800_000))}</TD>
                </TR>
                <TR>
                  <TD className="font-semibold">iPhone 11</TD>
                  <TD>IPS LCD</TD>
                  <TD>
                    <GradeBadge grade="Compatible A Grade" />
                  </TD>
                  <TD className="tabular text-right font-semibold">{formatMoney(paisa(620_000))}</TD>
                </TR>
              </tbody>
            </Table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Dialog</h2>
          <div className="mt-6">
            <Dialog triggerLabel="Cancel this order" title="Cancel order CA-ORD-261002-0042?" confirmLabel="Cancel order">
              The two screens on this order go back into stock and the customer gets an SMS.
            </Dialog>
          </div>
        </section>
      </Container>
    </main>
  );
}
