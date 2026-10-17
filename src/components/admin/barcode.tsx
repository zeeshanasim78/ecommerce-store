import { code128Widths } from "@/lib/code128";

/**
 * Code 128 barcode as SVG (labels, M10 Phase B). Bars are drawn in currentColor (midnight on the
 * label, which prints as black on a thermal printer); `crispEdges` keeps bar edges sharp when printed.
 * Ten modules of quiet zone on each side, as the standard asks.
 */
export function Barcode({ value, height = 60, className }: { value: string; height?: number; className?: string }) {
  let widths: number[];
  try {
    widths = code128Widths(value);
  } catch {
    return null;
  }
  const quiet = 10;
  const total = widths.reduce((a, b) => a + b, 0) + quiet * 2;
  let x = quiet;
  const bars: { x: number; w: number }[] = [];
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push({ x, w });
    x += w;
  });
  return (
    <svg viewBox={`0 0 ${total} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Barcode ${value}`} className={className} shapeRendering="crispEdges">
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={0} width={b.w} height={height} fill="currentColor" />
      ))}
    </svg>
  );
}
