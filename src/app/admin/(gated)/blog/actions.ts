"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { auditContext } from "@/server/audit";
import { archivePost, cleanPostInput, savePost, setPostStatus } from "@/server/content/blog";
import { ContentError } from "@/server/content/errors";
import { requireStaff } from "@/server/dal";
import { file, optionalText, text } from "@/server/forms";
import { UploadError, saveImage } from "@/server/uploads";

const back = (path: string, params: Record<string, string>): never => redirect(`${path}?${new URLSearchParams(params)}`);

/** Blog pages, the sitemap and the home page of /blog refresh at once. */
function refresh(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function savePostAction(formData: FormData) {
  const staff = await requireStaff("content");
  const id = optionalText(formData, "id");
  const formPath = id ? `/admin/blog/${id}` : "/admin/blog/new";

  let coverImage = optionalText(formData, "coverImage") ?? "";
  const upload = file(formData, "coverFile");
  if (upload) {
    try {
      coverImage = await saveImage(upload, "blog");
    } catch (e) {
      if (e instanceof UploadError) back(formPath, { error: e.message });
      throw e;
    }
  }
  if (formData.get("removeCover") === "on" && !upload) coverImage = "";

  const input = cleanPostInput({
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    excerpt: text(formData, "excerpt"),
    bodyMd: String(formData.get("bodyMd") ?? ""),
    coverImage,
    tags: text(formData, "tags"),
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    status: text(formData, "status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
  });

  let saved: { id: string; slug: string };
  try {
    saved = savePost(db, await auditContext(), staff.id, id, input as never);
  } catch (e) {
    if (e instanceof ContentError) return back(formPath, { error: e.message });
    throw e;
  }
  refresh(saved.slug);
  back("/admin/blog", { saved: input.status === "PUBLISHED" ? "Post saved and live on the blog." : "Draft saved.", highlight: saved.id });
}

export async function setPostStatusAction(formData: FormData) {
  const staff = await requireStaff("content");
  const id = text(formData, "id");
  const status = text(formData, "status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  try {
    const saved = setPostStatus(db, await auditContext(), staff.id, id, status);
    refresh(saved.slug);
  } catch (e) {
    if (e instanceof ContentError) return back("/admin/blog", { error: e.message });
    throw e;
  }
  back("/admin/blog", { saved: status === "PUBLISHED" ? "Post is live." : "Post is now a draft (hidden from the blog).", highlight: id });
}

export async function archivePostAction(formData: FormData) {
  const staff = await requireStaff("content");
  const id = text(formData, "id");
  const archive = text(formData, "archive") !== "no";
  try {
    archivePost(db, await auditContext(), staff.id, id, archive);
  } catch (e) {
    if (e instanceof ContentError) return back("/admin/blog", { error: e.message });
    throw e;
  }
  refresh();
  back("/admin/blog", { saved: archive ? "Post archived." : "Post restored as a draft." });
}
