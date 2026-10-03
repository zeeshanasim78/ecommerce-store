import { cn } from "@/lib/cn";

/**
 * Drawn stand-in for a product photo (Clarify Q14: real photos come later).
 * A display panel in a bezel, labelled with the model, in brand colours.
 */
export function ScreenPlaceholder({ brand, model, className }: { brand: string; model: string; className?: string }) {
  return (
    <div className={cn("grid aspect-square place-items-center bg-surface", className)} role="img" aria-label={`${brand} ${model} screen (illustration)`}>
      <div className="relative h-[78%] w-[44%] rounded-[1.4rem] bg-midnight p-[5%] shadow-[0_24px_40px_-24px_rgb(11_28_51/0.6)]">
        <div className="flex h-full flex-col justify-end rounded-[1rem] bg-[linear-gradient(160deg,#1c3557_0%,#0b1c33_55%,#3a1a12_100%)] p-[10%]">
          <span className="block text-[0.6rem] font-medium text-canvas/60">{brand}</span>
          <span className="block font-display text-[0.8rem] leading-tight font-bold text-canvas">{model}</span>
        </div>
        <span className="absolute top-[3.5%] left-1/2 h-[1.6%] w-[24%] -translate-x-1/2 rounded-full bg-midnight/80" />
      </div>
    </div>
  );
}
