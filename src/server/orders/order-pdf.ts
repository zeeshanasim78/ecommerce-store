import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatMoney, paisa } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { deliveryLabel, paymentSteps, type CustomerOrder } from "./order-details";

/**
 * The customer's order as a PDF (owner request v1.11, SPECIFICATION §23). Built on the server
 * with pdf-lib (no browser print dialog, same file on every device). Uses the built-in Helvetica
 * font, so characters it can't draw (e.g. Urdu script in a name) are shown as "?" rather than failing.
 */

const MIDNIGHT = rgb(11 / 255, 28 / 255, 51 / 255);
const TERRACOTTA = rgb(165 / 255, 42 / 255, 42 / 255);
const SURFACE = rgb(246 / 255, 239 / 255, 229 / 255);
const MUTED = rgb(0.36, 0.4, 0.47);
const A4 = { w: 595.28, h: 841.89 };
const M = 48; // page margin

const rs = (n: number) => formatMoney(paisa(n));

export async function buildOrderPdf(o: CustomerOrder, generatedAt: Date = new Date()): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Order ${o.code}`);
  pdf.setAuthor(o.storeName);
  pdf.setSubject("Order details");
  pdf.setCreator(o.storeName);
  pdf.setProducer(o.storeName);
  pdf.setCreationDate(generatedAt);
  pdf.setModificationDate(generatedAt);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(regular.getCharacterSet());
  const safe = (t: string) =>
    Array.from(t.replace(/−/g, "-").replace(/[\u0000-\u001f\u007f]/g, " "))
      .map((ch) => (supported.has(ch.codePointAt(0)!) ? ch : "?"))
      .join("");

  let page: PDFPage = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - M;

  const newPageIfNeeded = (need: number) => {
    if (y - need < M + 30) {
      page = pdf.addPage([A4.w, A4.h]);
      y = A4.h - M;
    }
  };
  const wrap = (text: string, font: PDFFont, size: number, width: number): string[] => {
    const out: string[] = [];
    for (const para of safe(text).split("\n")) {
      let line = "";
      for (const word of para.split(" ")) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) <= width) line = next;
        else {
          if (line) out.push(line);
          line = word;
        }
      }
      out.push(line);
    }
    return out;
  };
  const write = (
    text: string,
    opts: {
      font?: PDFFont;
      size?: number;
      x?: number;
      width?: number;
      color?: ReturnType<typeof rgb>;
      gap?: number;
    } = {},
  ) => {
    const font = opts.font ?? regular;
    const size = opts.size ?? 10;
    const x = opts.x ?? M;
    for (const line of wrap(text, font, size, opts.width ?? A4.w - x - M)) {
      newPageIfNeeded(size + 4);
      page.drawText(line, {
        x,
        y: y - size,
        size,
        font,
        color: opts.color ?? MIDNIGHT,
      });
      y -= size + (opts.gap ?? 4);
    }
  };
  const right = (text: string, xRight: number, yy: number, font: PDFFont, size: number) =>
    page.drawText(safe(text), {
      x: xRight - font.widthOfTextAtSize(safe(text), size),
      y: yy,
      size,
      font,
      color: MIDNIGHT,
    });
  const heading = (text: string) => {
    y -= 10;
    newPageIfNeeded(40);
    write(text.toUpperCase(), {
      font: bold,
      size: 9,
      color: TERRACOTTA,
      gap: 6,
    });
  };

  // Header band
  page.drawRectangle({
    x: 0,
    y: A4.h - 92,
    width: A4.w,
    height: 92,
    color: MIDNIGHT,
  });
  page.drawText(safe(o.storeName), {
    x: M,
    y: A4.h - 52,
    size: 24,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Order details", {
    x: M,
    y: A4.h - 72,
    size: 10,
    font: regular,
    color: rgb(0.85, 0.87, 0.9),
  });
  const codeW = bold.widthOfTextAtSize(o.code, 14);
  page.drawText(o.code, {
    x: A4.w - M - codeW,
    y: A4.h - 52,
    size: 14,
    font: bold,
    color: rgb(1, 1, 1),
  });
  const placed = safe(`Placed ${formatKarachi(o.placedAt)}`);
  page.drawText(placed, {
    x: A4.w - M - regular.widthOfTextAtSize(placed, 10),
    y: A4.h - 72,
    size: 10,
    font: regular,
    color: rgb(0.85, 0.87, 0.9),
  });
  y = A4.h - 92 - 28;

  // Status
  write(`Status: ${o.statusLabel}   ·   Payment: ${o.methodLabel} — ${o.paymentLabel}`, { font: bold, size: 11 });
  if (o.cancelled && o.cancelReason) write(`Cancelled: ${o.cancelReason}`, { color: TERRACOTTA });
  if (o.shipment) write(`Courier: ${o.shipment.courier}${o.shipment.cn ? `   ·   Tracking (CN): ${o.shipment.cn}` : ""}`);
  if (o.eta) write(`Delivery: ${o.eta}`, { color: MUTED });

  // Customer
  heading("Deliver to");
  write(o.name, { font: bold, size: 11 });
  write(`${o.phone}${o.email ? `   ·   ${o.email}` : ""}`);
  write(o.address);
  if (o.notes) write(`Notes: ${o.notes}`, { color: MUTED });

  // Items table
  heading("Items");
  const colQty = A4.w - M - 190;
  const colUnit = A4.w - M - 95;
  const colTotal = A4.w - M;
  page.drawText("Item", { x: M, y: y - 9, size: 9, font: bold, color: MUTED });
  right("Qty", colQty, y - 9, bold, 9);
  right("Unit price", colUnit, y - 9, bold, 9);
  right("Total", colTotal, y - 9, bold, 9);
  y -= 16;
  for (const i of o.items) {
    const nameLines = wrap(i.name, bold, 10, colQty - M - 40);
    const detailLines = wrap(i.detail, regular, 9, colQty - M - 40);
    newPageIfNeeded(14 * (nameLines.length + detailLines.length) + 8);
    page.drawLine({
      start: { x: M, y: y + 2 },
      end: { x: A4.w - M, y: y + 2 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    const rowTop = y - 12;
    right(String(i.qty), colQty, rowTop, regular, 10);
    right(rs(i.unitPaisa), colUnit, rowTop, regular, 10);
    right(rs(i.linePaisa), colTotal, rowTop, bold, 10);
    for (const l of nameLines) {
      page.drawText(l, {
        x: M,
        y: y - 12,
        size: 10,
        font: bold,
        color: MIDNIGHT,
      });
      y -= 14;
    }
    for (const l of detailLines) {
      page.drawText(l, {
        x: M,
        y: y - 11,
        size: 9,
        font: regular,
        color: MUTED,
      });
      y -= 13;
    }
    y -= 6;
  }
  page.drawLine({
    start: { x: M, y: y + 2 },
    end: { x: A4.w - M, y: y + 2 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 6;
  const totalRow = (label: string, value: string, strong = false) => {
    newPageIfNeeded(18);
    const f = strong ? bold : regular;
    const size = strong ? 12 : 10;
    right(label, colUnit, y - size, f, size);
    right(value, colTotal, y - size, f, size);
    y -= size + 6;
  };
  totalRow("Subtotal", rs(o.subtotalPaisa));
  if (o.discountPaisa) totalRow("Discount", `-${rs(o.discountPaisa)}`);
  totalRow("Delivery", deliveryLabel(o));
  if (o.codFeePaisa) totalRow("Cash on delivery fee", rs(o.codFeePaisa));
  totalRow("Total", rs(o.totalPaisa), true);

  // How to pay (prepaid orders still waiting)
  if (o.awaitingPayment) {
    heading("How to pay");
    paymentSteps(o).forEach((s, n) => write(`${n + 1}. ${s}`, { x: M + 4 }));
    if (o.payDeadline) write(`Please pay by ${formatKarachi(o.payDeadline)}.`, { font: bold });
    for (const p of o.payTo) {
      const lines = [p.method, ...p.lines];
      const h = lines.length * 14 + 14;
      newPageIfNeeded(h + 8);
      y -= 6;
      page.drawRectangle({
        x: M,
        y: y - h,
        width: A4.w - 2 * M,
        height: h,
        color: SURFACE,
      });
      y -= 8;
      lines.forEach((l, i) =>
        write(l, {
          x: M + 12,
          font: i === 0 ? bold : regular,
          size: 10,
          gap: 4,
        }),
      );
      y -= 6;
    }
  } else if (o.method === "COD" && !o.cancelled) {
    heading("Payment");
    write(`Pay ${rs(o.totalPaisa)} in cash to the courier on delivery.`);
  }

  // Footer on every page
  const contact = [o.contact.phone ? `Phone ${o.contact.phone}` : null, o.contact.whatsapp ? `WhatsApp ${o.contact.whatsapp}` : null, o.contact.email].filter(Boolean).join("   ·   ");
  const foot = safe(`${o.storeName}${contact ? `   ·   ${contact}` : ""}   ·   Generated ${formatKarachi(generatedAt.toISOString())}`);
  pdf.getPages().forEach((p, i, all) => {
    p.drawText(foot, { x: M, y: 28, size: 8, font: regular, color: MUTED });
    const n = `Page ${i + 1} of ${all.length}`;
    p.drawText(n, {
      x: A4.w - M - regular.widthOfTextAtSize(n, 8),
      y: 28,
      size: 8,
      font: regular,
      color: MUTED,
    });
  });

  return pdf.save();
}
