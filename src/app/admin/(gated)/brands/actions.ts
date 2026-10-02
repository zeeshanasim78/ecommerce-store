"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { brands } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { auditContext, writeAudit } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { friendlyDbError } from "@/server/db-errors";
import { checked, file, optionalText, text } from "@/server/forms";
import { revalidateStorefront } from "@/server/revalidate";
import { UploadError, saveImage } from "@/server/uploads";

const go = (params: Record<string, string>) => redirect(`/admin/brands?${new URLSearchParams(params)}`);

const BrandSchema = z.object({
  name: z.string().min(2, "Name the brand.").max(40),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lower-case letters, numbers and dashes in the web address."),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export async function saveBrand(formData: FormData) {
  const staff = await requireStaff("catalog");
  const id = optionalText(formData, "id");
  const name = text(formData, "name");
  const parsed = BrandSchema.safeParse({
    name,
    slug: text(formData, "slug") || slugify(name),
    sortOrder: text(formData, "sortOrder") || "0",
    isActive: checked(formData, "isActive"),
  });
  if (!parsed.success) go({ error: parsed.error.issues[0]?.message ?? "Check the form." });

  let logoUrl: string | undefined;
  const logo = file(formData, "logo");
  if (logo) {
    try {
      logoUrl = await saveImage(logo, "brands");
    } catch (e) {
      if (e instanceof UploadError) go({ error: e.message });
      throw e;
    }
  }

  const values = { ...parsed.data!, ...(logoUrl ? { logoUrl } : {}) };
  const ctx = await auditContext();
  let error: string | null = null;
  try {
    db.transaction((tx) => {
      const before = id ? tx.select().from(brands).where(eq(brands.id, id)).get() : undefined;
      // Renaming cascades to products.brand through the brands_rename_cascade trigger
      const savedId = id ?? tx.insert(brands).values(values).returning({ id: brands.id }).get().id;
      if (id) tx.update(brands).set(values).where(eq(brands.id, id)).run();
      writeAudit(tx, ctx, { actorId: staff.id, action: id ? "brand.update" : "brand.create", entity: "brands", entityId: savedId, before, after: values });
    });
  } catch (e) {
    error = friendlyDbError(e);
  }
  if (error) go({ error });
  revalidateStorefront();
  go({ saved: id ? "Brand updated." : "Brand added." });
}

export async function deleteBrand(formData: FormData) {
  const staff = await requireStaff("catalog");
  const id = text(formData, "id");
  const ctx = await auditContext();
  let error: string | null = null;
  try {
    db.transaction((tx) => {
      const before = tx.select().from(brands).where(eq(brands.id, id)).get();
      if (!before) return;
      tx.delete(brands).where(eq(brands.id, id)).run();
      writeAudit(tx, ctx, { actorId: staff.id, action: "brand.delete", entity: "brands", entityId: id, before });
    });
  } catch (e) {
    error = friendlyDbError(e);
  }
  if (error) go({ error });
  revalidateStorefront();
  go({ saved: "Brand deleted." });
}
