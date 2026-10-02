/**
 * Default home-page content (SPECIFICATION.md §16, v1.3). Used by the seed and as a
 * fallback when the settings rows are missing. Edited in Admin → Home page.
 * `sample: true` marks figures the owner hasn't confirmed yet; saving in admin clears it.
 */
export type HomeStat = { value: string; label: string; sample?: boolean };
export type HomeVideo = { webm: string | null; mp4: string | null; poster: string | null; caption: string };

export const HOME_STATS_DEFAULT: HomeStat[] = [
  { value: "3", label: "Branches in Pakistan" },
  { value: "2", label: "Branches in China" },
  { value: "48,000+", label: "LED & LCD screens sold", sample: true },
  { value: "1,200+", label: "Repair shops supplied", sample: true },
  { value: "7", label: "Phone brands in stock" },
];

export const HOME_VIDEO_DEFAULT: HomeVideo = {
  webm: "/media/screen-change.webm",
  mp4: "/media/screen-change.mp4",
  poster: "/media/screen-change.jpg",
  caption: "How an iPhone screen is changed, in six seconds (animation)",
};
