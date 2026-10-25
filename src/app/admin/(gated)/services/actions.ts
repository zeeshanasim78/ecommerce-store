"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { auditContext } from "@/server/audit";
import { ContentError } from "@/server/content/errors";
import { cleanServiceInput, moveService, saveService, setServiceActive } from "@/server/content/services";
import { requireStaff } from "@/server/dal";
import { checked, optionalText, text } from "@/server/forms";
import { revalidateStorefront } from "@/server/revalidate";

const back = (path: string, params: Record<string, string>): never => redirect(`${path}?${new URLSearchParams(params)}`);

export async function saveServiceAction(formData: FormData) {
  const staff = await requireStaff("content");
  const id = optionalText(formData, "id");
  const formPath = id ? `/admin/services/${id}` : "/admin/services/new";
  const input = cleanServiceInput({
    title: text(formData, "title"),
    summary: text(formData, "summary"),
    bodyMd: String(formData.get("bodyMd") ?? ""),
    icon: text(formData, "icon"),
    isActive: checked(formData, "isActive"),
  });
  let savedId: string;
  try {
    savedId = saveService(db, await auditContext(), staff.id, id, input);
  } catch (e) {
    if (e instanceof ContentError) return back(formPath, { error: e.message });
    throw e;
  }
  revalidateStorefront();
  back("/admin/services", { saved: "Service saved.", highlight: savedId });
}

export async function toggleServiceAction(formData: FormData) {
  const staff = await requireStaff("content");
  const id = text(formData, "id");
  const show = text(formData, "show") === "yes";
  try {
    setServiceActive(db, await auditContext(), staff.id, id, show);
  } catch (e) {
    if (e instanceof ContentError) return back("/admin/services", { error: e.message });
    throw e;
  }
  revalidateStorefront();
  back("/admin/services", { saved: show ? "Service is shown on the page." : "Service hidden.", highlight: id });
}

export async function moveServiceAction(formData: FormData) {
  const staff = await requireStaff("content");
  const id = text(formData, "id");
  moveService(db, await auditContext(), staff.id, id, text(formData, "direction") === "up" ? "up" : "down");
  revalidateStorefront();
  back("/admin/services", { saved: "Order updated.", highlight: id });
}
