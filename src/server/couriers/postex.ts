import { readCourierConfig, courierSecrets } from "./config";
import { asArray, clean, courierRequest, pick } from "./http";
import { CourierError, classifyStatus, codRupees, type BookingInput, type CourierProvider, type FetchLike, type TrackingResult } from "./types";

/**
 * PostEx merchant API (https://api.postex.pk/services/integration/api/order/), token in the
 * `token` header. Replies are `{ statusCode: "200", statusMessage, dist: … }`.
 * Endpoints: v3/create-order, v1/track-order/{cn}, v1/cancel-order (PUT), v2/get-operational-city,
 * v1/get-invoice?trackingNumbers= (airway bill PDF), v2/generate-load-sheet (PDF).
 * Status codes seen in tracking (0001 at merchant, 0003 at PostEx warehouse, 0004 on route,
 * 0005 delivered, 0002/0006/0007 returned, 0008 delivery under review, 0013 attempt made) are read
 * through their message text, with the code as a fallback.
 */
const CODE_TEXT: Record<string, string> = {
  "0001": "At merchant's warehouse",
  "0002": "Returned",
  "0003": "At PostEx warehouse",
  "0004": "Package on route",
  "0005": "Delivered",
  "0006": "Returned",
  "0007": "Returned",
  "0008": "Delivery under review",
  "0013": "Attempt made",
};

export function postexProvider(env: Record<string, string | undefined> = process.env, fetchImpl: FetchLike = fetch): CourierProvider {
  const cfg = readCourierConfig("POSTEX", env);
  const { token, pickupAddressCode } = courierSecrets("POSTEX", env) as { token: string; pickupAddressCode: string | null };

  function ready() {
    if (!cfg.configured) throw new CourierError("PostEx isn’t set up: add POSTEX_API_TOKEN to the environment file and restart.", "POSTEX");
  }
  async function json(path: string, init: RequestInit = {}) {
    ready();
    const body = (await courierRequest("POSTEX", fetchImpl, `${cfg.baseUrl}${path}`, {
      ...init,
      headers: { token, accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}) },
    })) as Record<string, unknown>;
    const code = String(pick(body, "statusCode") ?? "200");
    if (code !== "200") throw new CourierError(`PostEx: ${clean(pick(body, "statusMessage", "message") ?? `error ${code}`)}`, "POSTEX");
    return body;
  }
  async function pdf(path: string, init: RequestInit = {}) {
    ready();
    return (await courierRequest("POSTEX", fetchImpl, `${cfg.baseUrl}${path}`, {
      ...init,
      expect: "pdf",
      headers: { token, accept: "application/pdf", ...(init.body ? { "content-type": "application/json" } : {}) },
    })) as Uint8Array;
  }

  return {
    id: "POSTEX",

    async cities() {
      const body = await json("v2/get-operational-city");
      return asArray(pick(body, "dist"))
        .filter((c) => pick(c, "isDeliveryCity") !== false)
        .map((c) => {
          const name = clean(pick(c, "operationalCityName", "cityName", "name"), 80);
          return { code: name, name };
        })
        .filter((c) => c.name);
    },

    async book(input: BookingInput) {
      const body = await json("v3/create-order", {
        method: "POST",
        body: JSON.stringify({
          orderRefNumber: input.orderCode,
          invoicePayment: codRupees(input.codPaisa),
          orderDetail: input.contents,
          customerName: input.name,
          customerPhone: input.phone,
          deliveryAddress: input.address,
          cityName: input.city.code,
          invoiceDivision: 1,
          items: input.pieces,
          orderType: "Normal",
          transactionNotes: input.instructions,
          ...(pickupAddressCode ? { pickupAddressCode } : {}),
        }),
      });
      const cn = clean(pick(pick(body, "dist"), "trackingNumber"), 40).toUpperCase();
      if (!/^[A-Z0-9-]{4,40}$/.test(cn)) throw new CourierError("PostEx accepted the order but sent no tracking number — check the PostEx portal before booking again.", "POSTEX");
      return { cn, labelUrl: null }; // the airway bill comes from get-invoice (labelPdf)
    },

    async track(cns: string[]) {
      const out = new Map<string, TrackingResult>();
      for (const cn of cns) {
        let body: Record<string, unknown>;
        try {
          body = await json(`v1/track-order/${encodeURIComponent(cn)}`);
        } catch (e) {
          if (cns.length > 1 && e instanceof CourierError && !/refused the API key|didn’t answer|Couldn’t reach/.test(e.message)) continue; // one unknown CN shouldn't stop the rest
          throw e;
        }
        const d = pick(body, "dist");
        const history = asArray(pick(d, "transactionStatusHistory")).map((h) => {
          const code = String(pick(h, "transactionStatusMessageCode") ?? "");
          return {
            at: (pick(h, "updatedAt", "modifiedDatetime", "createdDatetime") as string | undefined) ?? null,
            text: clean(pick(h, "transactionStatusMessage") ?? CODE_TEXT[code] ?? code),
            code,
          };
        });
        const latest = history.at(-1);
        const text = clean(pick(d, "transactionStatus")) || latest?.text || "";
        out.set(cn.toUpperCase(), {
          cn: cn.toUpperCase(),
          status: classifyStatus(text) ?? classifyStatus(CODE_TEXT[latest?.code ?? ""]),
          text,
          events: history.map(({ at, text }) => ({ at, text })),
        });
      }
      return out;
    },

    async cancel(cn: string) {
      await json("v1/cancel-order", { method: "PUT", body: JSON.stringify({ trackingNumber: cn }) });
    },

    async labelPdf(cns: string[]) {
      const bytes = await pdf(`v1/get-invoice?trackingNumbers=${encodeURIComponent(cns.join(","))}`);
      return { pdf: bytes, fileName: `postex-airway-bill-${cns.length === 1 ? cns[0] : `${cns.length}-parcels`}.pdf` };
    },

    async loadSheet(cns: string[]) {
      const bytes = await pdf("v2/generate-load-sheet", { method: "POST", body: JSON.stringify({ trackingNumbers: cns, ...(pickupAddressCode ? { pickupAddress: pickupAddressCode } : {}) }) });
      return { ref: null, file: { pdf: bytes, fileName: `postex-load-sheet-${cns.length}-parcels.pdf` } };
    },
  };
}
