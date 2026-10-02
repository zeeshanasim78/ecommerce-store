"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { vendors } from "@/db/schema";
import { PAYMENT_TERMS, VENDOR_CURRENCIES } from "@/db/schema/purchasing";
import { attempt, goTo } from "@/server/action-helpers";
import { auditContext, writeAudit } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { list, optionalText, text } from "@/server/forms";

const VendorSchema = z.object({
  code: z
    .string()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9-]{2,16}$/, "Vendor code: 2–16 capital letters, numbers or dashes.")),
  name: z.string().min(2, "Name the vendor.").max(80),
  contactPerson: z.string().max(80).nullable(),
  phone: z.string().max(30).regex(/^[+0-9 ()-]*$/, "Phone: numbers, spaces, + and dashes only.").nullable(),
  email: z.email("Enter a valid email or leave it blank.").max(120).nullable(),
  city: z.string().max(60).nullable(),
  country: z
    .string()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{2}$/, "Country: two-letter code, e.g. PK or CN.")),
  currency: z.enum(VENDOR_CURRENCIES),
  paymentTerms: z.enum(PAYMENT_TERMS),
  leadTimeDays: z.coerce.number().int("Lead time: whole days.").min(0).max(365),
  rating: z.coerce.number().int().min(1).max(5).nullable(),
  brandsSupplied: z.array(z.string().max(40)).max(30),
  notes: z.string().max(2000).nullable(),
});

/** V-001, V-002 … */
function nextVendorCode(): string {
  const row = db
    .select({ n: sql<number | null>`max(cast(substr(${vendors.code}, 3) as integer))` })
    .from(vendors)
    .where(sql`${vendors.code} glob 'V-[0-9]*'`)
    .get();
  return `V-${String((row?.n ?? 0) + 1).padStart(3, "0")}`;
}

export async function saveVendor(formData: FormData) {
  const staff = await requireStaff("vendors");
  const id = optionalText(formData, "id");
  const formPath = id ? `/admin/vendors/${id}` : "/admin/vendors/new";
  const rating = text(formData, "rating");
  const parsed = VendorSchema.safeParse({
    code: text(formData, "code") || (id ? "" : nextVendorCode()),
    name: text(formData, "name"),
    contactPerson: optionalText(formData, "contactPerson"),
    phone: optionalText(formData, "phone"),
    email: optionalText(formData, "email"),
    city: optionalText(formData, "city"),
    country: text(formData, "country") || "PK",
    currency: text(formData, "currency"),
    paymentTerms: text(formData, "paymentTerms"),
    leadTimeDays: text(formData, "leadTimeDays") || "7",
    rating: rating === "" ? null : rating,
    brandsSupplied: list(formData, "brandsSupplied"),
    notes: optionalText(formData, "notes"),
  });
  if (!parsed.success) goTo(formPath, { error: parsed.error.issues[0]?.message ?? "Check the form." });
  const values = parsed.data!;

  const ctx = await auditContext();
  const result = attempt(() =>
    db.transaction(
      (tx) => {
        const before = id ? tx.select().from(vendors).where(eq(vendors.id, id)).get() : undefined;
        if (id && !before) throw new Error("Vendor not found");
        const savedId = id ?? crypto.randomUUID();
        if (id) tx.update(vendors).set(values).where(eq(vendors.id, id)).run();
        else tx.insert(vendors).values({ id: savedId, ...values }).run();
        writeAudit(tx, ctx, { actorId: staff.id, action: id ? "vendor.update" : "vendor.create", entity: "vendors", entityId: savedId, before, after: values });
        return savedId;
      },
      { behavior: "immediate" },
    ),
  );
  if (!result.ok) goTo(formPath, { error: result.error });
  goTo(`/admin/vendors/${result.value}`, { saved: id ? "Vendor saved." : "Vendor added. You can now raise purchase orders for them." });
}

export async function setVendorArchived(formData: FormData) {
  const staff = await requireStaff("vendors");
  const id = text(formData, "id");
  const archive = text(formData, "archive") === "1";
  const ctx = await auditContext();
  db.transaction((tx) => {
    tx.update(vendors).set({ archivedAt: archive ? new Date().toISOString() : null }).where(eq(vendors.id, id)).run();
    writeAudit(tx, ctx, { actorId: staff.id, action: archive ? "vendor.archive" : "vendor.restore", entity: "vendors", entityId: id });
  });
  goTo(`/admin/vendors/${id}`, { saved: archive ? "Vendor archived. Their purchase orders are kept." : "Vendor restored." });
}
