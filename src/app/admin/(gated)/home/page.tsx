import { AdminHeader, Notice, Section } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { HOME_VIDEO_DEFAULT } from "@/db/home-defaults";
import { requireStaff } from "@/server/dal";
import { getHomeStats, getHomeVideo } from "@/server/storefront/home-content";
import { saveStats, saveVideoSettings } from "./actions";

export const metadata = { title: "Home page" };

const fileInput =
  "rounded-full border border-midnight/18 bg-white px-4 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-midnight file:px-3 file:py-1 file:text-sm file:text-canvas";

export default async function HomeContentPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireStaff("hero");
  const { saved, error } = await searchParams;
  const stats = getHomeStats();
  const video = getHomeVideo();
  const isDefault = video.webm === HOME_VIDEO_DEFAULT.webm && video.mp4 === HOME_VIDEO_DEFAULT.mp4;
  const rows = Array.from({ length: 6 }, (_, i) => stats[i]);

  return (
    <>
      <AdminHeader title="Home page" description="The numbers band under the hero, and the repair video in “Changing a screen, explained”." />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="flex flex-col gap-8">
        <form action={saveStats}>
          <Section
            title="Caidea in numbers"
            description="Up to 6 figures, shown left to right. Leave a row empty to remove it. Figures marked “sample” are placeholders — please replace them with your real numbers."
          >
            {rows.map((row, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
                <Field id={`value${i}`} label={i === 0 ? "Figure" : `Figure ${i + 1}`}>
                  <Input id={`value${i}`} name={`value${i}`} maxLength={12} defaultValue={row?.value ?? ""} placeholder="48,000+" className="tabular font-semibold" />
                </Field>
                <Field id={`label${i}`} label="Label">
                  <Input id={`label${i}`} name={`label${i}`} maxLength={40} defaultValue={row?.label ?? ""} placeholder="LED & LCD screens sold" />
                </Field>
                <span className="h-11 content-center text-sm font-semibold text-terracotta">{row?.sample ? "sample" : ""}</span>
              </div>
            ))}
            <div>
              <Button type="submit">Save figures</Button>
            </div>
          </Section>
        </form>

        <form action={saveVideoSettings}>
          <Section
            title="Repair video"
            description={
              isDefault
                ? "Showing the built-in 6-second animation of an iPhone screen change. Upload your own short clip to replace it."
                : "Showing your uploaded video."
            }
          >
            <video className="aspect-[4/5] w-full max-w-xs rounded-bezel bg-surface object-cover" muted loop playsInline autoPlay poster={video.poster ?? undefined}>
              {video.webm ? <source src={video.webm} type="video/webm" /> : null}
              {video.mp4 ? <source src={video.mp4} type="video/mp4" /> : null}
            </video>
            <Field id="video" label="Replace with a video (optional)" hint="MP4 or WebM, up to 20 MB. Best: 5–10 seconds, portrait (4:5), no sound — it plays muted and loops.">
              <input id="video" name="video" type="file" accept="video/mp4,video/webm" className={fileInput} />
            </Field>
            <Field id="poster" label="Still image shown before it plays (optional)" hint="JPG, PNG or WebP. Shown to visitors who prefer reduced motion.">
              <input id="poster" name="poster" type="file" accept="image/jpeg,image/png,image/webp" className={fileInput} />
            </Field>
            <Field id="caption" label="Caption">
              <Input id="caption" name="caption" maxLength={120} defaultValue={video.caption} />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Save video</Button>
              {!isDefault ? (
                <button type="submit" name="reset" value="1" className="inline-flex h-11 items-center rounded-full px-6 font-semibold text-midnight hover:bg-midnight/6">
                  Use the built-in animation again
                </button>
              ) : null}
            </div>
          </Section>
        </form>
      </div>
    </>
  );
}
