/**
 * Code 128 barcodes for shipping labels (CN and order numbers), no library.
 * Code set C (pairs of digits) for all-digit values of even length, otherwise code set B
 * (printable ASCII). Returns bar/space widths in modules; the label draws them as SVG rectangles.
 * ISO/IEC 15417: start symbol, data, modulo-103 check symbol, stop symbol (13 modules).
 */

// Bar/space widths of the 107 symbols (each sums to 11 modules; the stop symbol to 13).
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
] as const;
export const CODE128_PATTERNS = PATTERNS;
const START_B = 104;
const START_C = 105;
const STOP = 106;

/** Symbol values (start, data, check, stop) for `value`. Throws on characters Code 128 B can't carry. */
export function code128Symbols(value: string): number[] {
  if (!value) throw new Error("Nothing to encode");
  const useC = /^\d+$/.test(value) && value.length % 2 === 0 && value.length >= 4;
  const data: number[] = [];
  if (useC) {
    for (let i = 0; i < value.length; i += 2) data.push(Number(value.slice(i, i + 2)));
  } else {
    for (const ch of value) {
      const c = ch.charCodeAt(0);
      if (c < 32 || c > 126) throw new Error(`Can't put “${ch}” in a barcode`);
      data.push(c - 32);
    }
  }
  const start = useC ? START_C : START_B;
  const check = data.reduce((sum, v, i) => sum + v * (i + 1), start) % 103;
  return [start, ...data, check, STOP];
}

/** Alternating bar/space widths (starting with a bar), quiet zones not included. */
export function code128Widths(value: string): number[] {
  return code128Symbols(value).flatMap((s) => PATTERNS[s]!.split("").map(Number));
}
