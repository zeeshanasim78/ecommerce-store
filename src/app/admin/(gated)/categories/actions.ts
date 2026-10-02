"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { auditContext, writeAudit } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { friendlyDbError } from "@/server/db-errors";
import { checked, optionalText, text } from "@/server/forms";
import { revalidateStorefront } from "@/server/revalidate";

const go = (params: Record<string, string>) => redirect(`/admin/categories?${new URLSearchParams(params)}`);

const CategorySchema = z.object({
  name: z.string().min(2, "Name the category.").max(60),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lower-case letters, numbers and dashes in the web address."),
  description: z.string().max(240).nullable(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export async function saveCategory(formData: FormData) {
  const staff = await requireStaff("catalog");
  const id = optionalText(formData, "id");
  const name = text(formData, "name");
  const parsed = CategorySchema.safeParse({
    name,
    slug: text(formData, "slug") || slugify(name),
    description: optionalText(formData, "description"),
    sortOrder: text(formData, "sortOrder") || "0",
    isActive: checked(formData, "isActive"),
  });
  if (!parsed.success) go({ error: parsed.error.issues[0]?.message ?? "Check the form." });

  const ctx = await auditContext();
  let error: string | null = null;
  try {
    db.transaction((tx) => {
      const before = id ? tx.select().from(categories).where(eq(categories.id, id)).get() : undefined;
      const savedId = id ? id : tx.insert(categories).values(parsed.data!).returning({ id: categories.id }).get().id;
      if (id) tx.update(categories).set(parsed.data!).where(eq(categories.id, id)).run();
      writeAudit(tx, ctx, { actorId: staff.id, action: id ? "category.update" : "category.create", entity: "categories", entityId: savedId, before, after: parsed.data });
    });
  } catch (e) {
    error = friendlyDbError(e);
  }
  if (error) go({ error });
  revalidateStorefront();
  go({ saved: id ? "Category updated." : "Category added." });
}

export async function deleteCategory(formData: FormData) {
  const staff = await requireStaff("catalog");
  const id = text(formData, "id");
  const ctx = await auditContext();
  db.transaction((tx) => {
    const before = tx.select().from(categories).where(eq(categories.id, id)).get();
    if (!before) return;
    tx.delete(categories).where(eq(categories.id, id)).run(); // trigger un-assigns its products
    writeAudit(tx, ctx, { actorId: staff.id, action: "category.delete", entity: "categories", entityId: id, before });
  });
  revalidateStorefront();
  go({ saved: "Category deleted. Its products are now uncategorised." });
}
