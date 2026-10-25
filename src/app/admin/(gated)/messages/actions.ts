"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { auditContext } from "@/server/audit";
import { setMessageStatus } from "@/server/content/contact";
import { ContentError } from "@/server/content/errors";
import { requireStaff } from "@/server/dal";
import { text } from "@/server/forms";

export async function setMessageStatusAction(formData: FormData) {
  const staff = await requireStaff("messages");
  const id = text(formData, "id");
  const raw = text(formData, "status");
  const status = raw === "REPLIED" || raw === "SPAM" ? raw : "NEW";
  const view = text(formData, "view");
  const base = view && view !== "NEW" ? `/admin/messages?show=${encodeURIComponent(view)}` : "/admin/messages";
  const sep = base.includes("?") ? "&" : "?";
  try {
    setMessageStatus(db, await auditContext(), staff.id, id, status);
  } catch (e) {
    if (e instanceof ContentError) redirect(`${base}${sep}error=${encodeURIComponent(e.message)}`);
    throw e;
  }
  redirect(`${base}${sep}saved=${encodeURIComponent(status === "REPLIED" ? "Marked as answered." : status === "SPAM" ? "Marked as spam." : "Moved back to new.")}`);
}
