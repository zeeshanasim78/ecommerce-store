import type { CSSProperties } from "react";
import { MotionScene } from "./motion-scene";

/**
 * v1.11 CSS-3D scenes for the home page (SPECIFICATION §23.5). Decorative: the same facts are
 * in the text beside them, so the drawings are hidden from screen readers.
 */

const vars = (v: Record<string, string | number>) => v as CSSProperties;

export const ASSEMBLY_LAYERS = [
  {
    name: "Back cover",
    text: "Stays with your phone — not part of the screen.",
  },
  { name: "Battery", text: "Disconnected first, before any screen cable." },
  {
    name: "Mid-frame",
    text: "“With frame” screens arrive already bonded to a new one.",
  },
  {
    name: "Display panel",
    text: "OLED / AMOLED or LCD — this is what the grade describes.",
  },
  {
    name: "Cover glass + touch",
    text: "Laminated to the panel in a display assembly.",
  },
];

const LAYER_STYLE = [
  "linear-gradient(145deg, var(--color-terracotta), color-mix(in srgb, var(--color-terracotta) 55%, var(--color-midnight)))",
  "linear-gradient(160deg, var(--color-amber), color-mix(in srgb, var(--color-amber) 50%, var(--color-midnight)))",
  "linear-gradient(150deg, color-mix(in srgb, var(--color-canvas) 30%, var(--color-midnight)), var(--color-midnight))",
  "radial-gradient(120% 80% at 30% 20%, color-mix(in srgb, var(--color-amber) 45%, transparent), transparent 55%), radial-gradient(90% 70% at 80% 85%, color-mix(in srgb, var(--color-terracotta) 55%, transparent), transparent 60%), var(--color-midnight)",
  "linear-gradient(135deg, color-mix(in srgb, var(--color-white) 55%, transparent), color-mix(in srgb, var(--color-white) 8%, transparent) 60%)",
];

/** Repair section: a display assembly that separates into its layers and closes again. */
export function ExplodedPhone() {
  return (
    <MotionScene label="phone layers" dark className="overflow-hidden rounded-bezel-lg bg-midnight text-canvas">
      <div className="ambient-dark absolute inset-0" aria-hidden="true" />
      <div className="relative grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[1fr_1fr]">
        <div className="xp-stage grid h-[22rem] place-items-center sm:h-[26rem]" aria-hidden="true">
          <div className="xp-rig text-[0.8rem] sm:text-[0.95rem]" style={{ width: "10em", height: "20em" }}>
            {LAYER_STYLE.map((bg, i) => (
              <div
                key={i}
                className="xp-layer"
                style={{
                  ...vars({ "--i": i }),
                  background: bg,
                  opacity: i === 4 ? 0.85 : 1,
                }}
              >
                {i === 1 ? <div className="absolute inset-[18%_14%] rounded-[0.6em] border border-midnight/30" /> : null}
                {i === 2 ? (
                  <div className="absolute inset-[6%] rounded-[1em] border-2 border-canvas/25">
                    {[
                      [12, 10],
                      [82, 10],
                      [12, 88],
                      [82, 88],
                    ].map(([x, y]) => (
                      <span key={`${x}-${y}`} className="absolute size-[0.5em] rounded-full bg-canvas/50" style={{ left: `${x}%`, top: `${y}%` }} />
                    ))}
                  </div>
                ) : null}
                {i === 4 ? <div className="absolute top-[3%] left-1/2 h-[0.5em] w-[2.4em] -translate-x-1/2 rounded-full bg-midnight/50" /> : null}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-amber uppercase">Inside a display assembly</p>
          <h3 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-canvas md:text-[2rem]">Five layers, one part you replace</h3>
          <ol className="mt-6 flex flex-col gap-3">
            {[...ASSEMBLY_LAYERS].reverse().map((l, n) => (
              <li key={l.name} className="xp-tag grid grid-cols-[1.25rem_1fr] gap-3" style={{ animationDelay: `${n * 0.12}s` }}>
                <span className="mt-1.5 size-3 rounded-full" style={{ background: LAYER_STYLE[4 - n] }} aria-hidden="true" />
                <span>
                  <span className="font-semibold text-canvas">{l.name}</span>
                  <span className="block text-[0.9375rem] text-canvas/70">{l.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </MotionScene>
  );
}

const PANE_STYLE = [
  "radial-gradient(90% 60% at 30% 25%, color-mix(in srgb, var(--color-amber) 70%, transparent), transparent 60%), radial-gradient(80% 60% at 75% 80%, color-mix(in srgb, var(--color-terracotta) 75%, transparent), transparent 65%), var(--color-midnight)",
  "radial-gradient(70% 50% at 50% 35%, color-mix(in srgb, var(--color-terracotta) 65%, transparent), transparent 60%), var(--color-midnight)",
  "linear-gradient(160deg, color-mix(in srgb, var(--color-canvas) 55%, var(--color-midnight)), color-mix(in srgb, var(--color-amber) 25%, var(--color-midnight)))",
];

/** Grades band: three glowing panes, one per grade, turning slowly. */
export function GradeRing({ grades }: { grades: string[] }) {
  return (
    <MotionScene label="screen grades" dark className="h-[20rem] sm:h-[24rem]">
      <div className="ring-stage grid h-full place-items-center" aria-hidden="true">
        <div className="ring-rig text-[0.75rem] sm:text-[0.9rem]" style={{ width: "8em", height: "15em" }}>
          {grades.slice(0, 3).map((g, i) => (
            <div key={g} className="ring-pane overflow-hidden ring-1 ring-canvas/25" style={{ ...vars({ "--i": i }), background: PANE_STYLE[i] }}>
              <div
                className="ring-pane-glow absolute inset-0"
                style={{
                  ...vars({ "--i": i }),
                  background: "radial-gradient(60% 40% at 50% 0%, color-mix(in srgb, var(--color-white) 35%, transparent), transparent)",
                }}
              />
              <div className="absolute top-[4%] left-1/2 h-[0.45em] w-[2em] -translate-x-1/2 rounded-full bg-canvas/30" />
              <p className="absolute inset-x-0 bottom-[8%] px-2 text-center text-[1em] font-bold text-canvas">{g}</p>
            </div>
          ))}
        </div>
        <div className="absolute bottom-[8%] left-1/2 h-8 w-64 -translate-x-1/2 rounded-[50%] bg-amber/25 blur-2xl" />
      </div>
    </MotionScene>
  );
}

const ICONS = [
  // shield with check — carefully selected grades
  <path key="a" d="M12 2.5l7.5 3v6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10v-6l7.5-3zm-3.2 9.7l2.3 2.3 4.4-4.6" />,
  // stacked layers — handled properly
  <path key="b" d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm-9 9l9 4.5 9-4.5M3 16.5L12 21l9-4.5" />,
  // delivery van — delivered safely
  <path key="c" d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.2v2.8h-7M6.5 18.5a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6zm11 0a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6z" />,
];

/** Values: cards that tilt in 3D on hover / focus, each with a floating icon. */
export function ValueCards({ values }: { values: { title: string; text: string }[] }) {
  return (
    <MotionScene label="values" className="pb-14">
      <div className="mt-12 grid gap-8 [perspective:1200px] md:grid-cols-3">
        {values.map((v, i) => (
          <article key={v.title} className="tilt-card rounded-bezel bg-white p-7 ring-1 ring-midnight/8">
            <div className="relative h-20 [perspective:600px]" aria-hidden="true">
              <div className="float-icon grid size-16 place-items-center rounded-bezel-sm bg-midnight text-canvas shadow-[0_18px_30px_-18px_rgb(11_28_51/0.8)]" style={vars({ "--i": i })}>
                <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {ICONS[i % ICONS.length]}
                </svg>
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-amber" />
              </div>
              <div className="float-shadow absolute bottom-0 left-2 h-2 w-12 rounded-[50%] bg-midnight/40 blur-[3px]" style={vars({ "--i": i })} />
            </div>
            <h3 className="mt-4 text-xl font-bold tracking-[-0.01em]">{v.title}</h3>
            <p className="mt-3 leading-relaxed text-midnight/75">{v.text}</p>
            <span className="mt-6 block h-1 w-12 rounded-full bg-terracotta" aria-hidden="true" />
          </article>
        ))}
      </div>
    </MotionScene>
  );
}
