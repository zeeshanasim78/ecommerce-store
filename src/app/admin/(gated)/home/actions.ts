"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { HOME_VIDEO_DEFAULT } from "@/db/home-defaults";
import { settings } from "@/db/schema";
import { auditContext, writeAudit } from "@/server/audit";
import { requireStaff } from "@/server/dal";
import { file, text } from "@/server/forms";
import { revalidateStorefront } from "@/server/revalidate";
import { HomeStatsSchema, HomeVideoSchema, getHomeVideo } from "@/server/storefront/home-content";
import { UploadError, saveImage, saveVideo } from "@/server/uploads";

const go = (params: Record<string, string>) => redirect(`/admin/home?${new URLSearchParams(params)}`);

async function saveSetting(key: "home_stats" | "home_video", value: unknown, actorId: string, before: unknown) {
  const ctx = await auditContext();
  db.transaction((tx) => {
    tx.insert(settings)
      .values({ key, value, updatedBy: actorId, updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedBy: actorId, updatedAt: new Date().toISOString() } })
      .run();
    writeAudit(tx, ctx, { actorId, action: `settings.${key}`, entity: "settings", entityId: key, before, after: value });
  });
  revalidateStorefront();
}

/** Saves the "Caidea in numbers" figures. Rows with an empty value and label are dropped. */
export async function saveStats(formData: FormData) {
  const staff = await requireStaff("hero");
  const rows = [];
  for (let i = 0; i < 6; i++) {
    const value = text(formData, `value${i}`);
    const label = text(formData, `label${i}`);
    if (!value && !label) continue;
    // Saving confirms the figure, so the "sample" marker is cleared
    rows.push({ value, label });
  }
  const parsed = HomeStatsSchema.safeParse(rows);
  if (!parsed.success) go({ error: "Each figure needs a value (up to 12 characters, e.g. 48,000+) and a label (2–40 characters). Keep 1–6 figures." });
  await saveSetting("home_stats", parsed.data, staff.id, null);
  go({ saved: "Figures saved." });
}

/** Replaces the repair video (and optionally its poster image), or resets to the built-in animation. */
export async function saveVideoSettings(formData: FormData) {
  const staff = await requireStaff("hero");
  const before = getHomeVideo();
  if (text(formData, "reset") === "1") {
    await saveSetting("home_video", HOME_VIDEO_DEFAULT, staff.id, before);
    go({ saved: "Back to the built-in repair animation." });
  }

  const next = { ...before, caption: text(formData, "caption") || before.caption };
  try {
    const video = file(formData, "video");
    if (video) {
      const saved = await saveVideo(video);
      // An uploaded clip replaces both formats; browsers play whichever they support
      next.webm = saved.kind === "webm" ? saved.url : null;
      next.mp4 = saved.kind === "mp4" ? saved.url : null;
      if (!file(formData, "poster")) next.poster = null; // the old poster belongs to the old video
    }
    const poster = file(formData, "poster");
    if (poster) next.poster = await saveImage(poster, "home");
  } catch (e) {
    if (e instanceof UploadError) go({ error: e.message });
    throw e;
  }

  const parsed = HomeVideoSchema.safeParse(next);
  if (!parsed.success) go({ error: "The caption should be 3–120 characters." });
  await saveSetting("home_video", parsed.data, staff.id, before);
  go({ saved: "Video settings saved." });
}
