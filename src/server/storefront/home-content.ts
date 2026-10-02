import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { HOME_STATS_DEFAULT, HOME_VIDEO_DEFAULT, type HomeStat, type HomeVideo } from "@/db/home-defaults";

/** Home-page content from settings (SPECIFICATION.md §16, v1.3), with safe defaults. */

const MediaUrl = z
  .string()
  .refine((v) => v.startsWith("/media/") || v.startsWith("/uploads/"), "Only site media or uploads")
  .nullable();

export const HomeStatsSchema = z
  .array(z.object({ value: z.string().trim().min(1).max(12), label: z.string().trim().min(2).max(40), sample: z.boolean().optional() }))
  .min(1)
  .max(6);

export const HomeVideoSchema = z.object({
  webm: MediaUrl,
  mp4: MediaUrl,
  poster: MediaUrl,
  caption: z.string().trim().min(3).max(120),
});

function readSetting<T>(key: "home_stats" | "home_video", schema: z.ZodType<T>, fallback: T): T {
  const row = db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).get();
  const parsed = schema.safeParse(row?.value);
  return parsed.success ? parsed.data : fallback;
}

export const getHomeStats = (): HomeStat[] => readSetting("home_stats", HomeStatsSchema, HOME_STATS_DEFAULT);
export const getHomeVideo = (): HomeVideo => readSetting("home_video", HomeVideoSchema, HOME_VIDEO_DEFAULT);
