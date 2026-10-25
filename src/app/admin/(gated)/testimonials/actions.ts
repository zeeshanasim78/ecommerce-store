"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { auditContext } from "@/server/audit";
import { ContentError } from "@/server/content/errors";
import { archiveTestimonial, cleanTestimonialInput, moveTestimonial, saveTestimonial, setTestimonialPublished } from "@/server/content/testimonials";
import { requireStaff } from "@/server/dal";
import { checked, optionalText, text } from "@/server/forms";
import { revalidateStorefront } from "@/server/revalidate";

const back = (path: string, params: Record<string, string>): never => redirect(`${path}?${new URLSearchParams(params)}`);

export async function saveTestimonialAction(formData: FormData) {
  const staff = await requireStaff("content");
  const id = optionalText(formData, "id");
  const formPath = id ? `/admin/testimonials/${id}` : "/admin/testimonials/new";
  const input = cleanTestimonialInput({
    authorName: text(formData, "authorName"),
    authorRole: text(formData, "authorRole"),
    city: text(formData, "city"),
    rating: text(formData, "rating"),
    quote: text(formData, "quote"),
    isPublished: checked(formData, "isPublished"),
  });
  let savedId: string;
  try {
    savedId = saveTestimonial(db, await auditContext(), staff.id, id, input);
  } catch (e) {
    if (e instanceof ContentError) return back(formPath, { error: e.message });
    throw e;
  }
  revalidateStorefront();
  back("/admin/testimonials", { saved: input.isPublished ? "Testimonial saved and shown on the site." : "Testimonial saved (hidden).", highlight: savedId });
}

export async function toggleTestimonialAction(formData: FormData) {
  const staff = await requireStaff("content");
  const id = text(formData, "id");
  const publish = text(formData, "publish") === "yes";
  try {
    setTestimonialPublished(db, await auditContext(), staff.id, id, publish);
  } catch (e) {
    if (e instanceof ContentError) return back("/admin/testimonials", { error: e.message });
    throw e;
  }
  revalidateStorefront();
  back("/admin/testimonials", { saved: publish ? "Testimonial is shown on the site." : "Testimonial hidden.", highlight: id });
}

export async function moveTestimonialAction(formData: FormData) {
  const staff = await requireStaff("content");
  const id = text(formData, "id");
  moveTestimonial(db, await auditContext(), staff.id, id, text(formData, "direction") === "up" ? "up" : "down");
  revalidateStorefront();
  back("/admin/testimonials", { saved: "Order updated.", highlight: id });
}

export async function archiveTestimonialAction(formData: FormData) {
  const staff = await requireStaff("content");
  const id = text(formData, "id");
  const archive = text(formData, "archive") !== "no";
  try {
    archiveTestimonial(db, await auditContext(), staff.id, id, archive);
  } catch (e) {
    if (e instanceof ContentError) return back("/admin/testimonials", { error: e.message });
    throw e;
  }
  revalidateStorefront();
  back(archive ? "/admin/testimonials" : "/admin/testimonials?show=archived", { saved: archive ? "Testimonial archived." : "Testimonial restored (hidden)." });
}
