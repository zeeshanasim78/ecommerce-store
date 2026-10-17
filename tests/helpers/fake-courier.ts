import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * A pretend Leopards + PostEx on this machine, for unit tests and the browser walk-through
 * (COURIER_TEST_BASE_URL=http://127.0.0.1:<port>). It checks the keys and required fields the
 * real APIs need, books parcels with made-up CNs, and lets a test move a parcel along:
 *   POST /__control/status {"cn":"LE…","text":"Delivered"}
 *   GET  /__control/requests          (what the app sent, keys removed)
 *   POST /__control/fail {"times":1}  (next N courier calls answer 500)
 * Standalone: npx tsx tests/helpers/fake-courier.ts 4010
 */

export const FAKE_LEOPARDS_KEY = "TESTKEY12345";
export const FAKE_LEOPARDS_PASSWORD = "test-pass";
export const FAKE_POSTEX_TOKEN = "TESTTOKEN-postex-0123456789";

export const FAKE_CITIES = [
  { id: 789, name: "Lahore" },
  { id: 475, name: "Karachi" },
  { id: 202, name: "Islamabad" },
  { id: 203, name: "Rawalpindi" },
  { id: 186, name: "Faisalabad" },
];

export type FakeCourier = {
  url: string;
  server: Server;
  parcels: Map<string, { courier: "LEOPARDS" | "POSTEX"; text: string; cod: number; ref: string; cancelled: boolean }>;
  requests: { courier: string; path: string; body: Record<string, unknown> | null }[];
  setStatus(cn: string, text: string): void;
  close(): Promise<void>;
};

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

async function readBody(req: IncomingMessage): Promise<Record<string, unknown> | null> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (!chunks.length) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function startFakeCourier(port = 0): Promise<FakeCourier> {
  const parcels: FakeCourier["parcels"] = new Map();
  const requests: FakeCourier["requests"] = [];
  let failNext = 0;
  let seq = 1000;

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const path = url.pathname;
    const body = await readBody(req);
    const send = (status: number, data: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(data));
    };

    if (path.startsWith("/__control/")) {
      if (path === "/__control/status" && body) {
        const p = parcels.get(String(body.cn).toUpperCase());
        if (p) p.text = String(body.text);
        return send(p ? 200 : 404, { ok: Boolean(p) });
      }
      if (path === "/__control/requests") return send(200, requests);
      if (path === "/__control/fail") {
        failNext = Number(body?.times ?? 1);
        return send(200, { ok: true });
      }
      if (path === "/__control/parcels") return send(200, Object.fromEntries(parcels));
      return send(404, {});
    }

    const safe = body ? Object.fromEntries(Object.entries(body).filter(([k]) => k !== "api_key" && k !== "api_password")) : null;
    requests.push({ courier: path.split("/")[1] ?? "", path: path + url.search, body: safe });
    if (failNext > 0) {
      failNext -= 1;
      res.writeHead(500, { "content-type": "text/plain" });
      return res.end("Internal error");
    }

    // ---- Leopards: POST /leopards/api/<method>/format/json/ ----
    const leo = /^\/leopards\/api\/(\w+)\/format\/json\/?$/.exec(path);
    if (leo) {
      if (req.method !== "POST") return send(405, {});
      if (body?.api_key !== FAKE_LEOPARDS_KEY || body?.api_password !== FAKE_LEOPARDS_PASSWORD) return send(200, { status: 0, error: "Invalid API Key or Password" });
      const method = leo[1];
      if (method === "getAllCities") return send(200, { status: 1, error: 0, city_list: FAKE_CITIES.map((c) => ({ ...c, shipment_type: ["overnight"], allow_as_origin: true, allow_as_destination: true })) });
      if (method === "bookPacket") {
        const required = ["booked_packet_weight", "booked_packet_no_piece", "booked_packet_collect_amount", "origin_city", "destination_city", "shipment_id", "shipment_name_eng", "shipment_email", "shipment_phone", "shipment_address", "consignment_name_eng", "consignment_phone", "consignment_address", "special_instructions"];
        const missing = required.filter((k) => body[k] === undefined || body[k] === "");
        if (missing.length) return send(200, { status: 0, error: `Missing: ${missing.join(", ")}` });
        if (!FAKE_CITIES.some((c) => c.id === body.destination_city)) return send(200, { status: 0, error: "Invalid destination city" });
        if (!/^03\d{9}$/.test(String(body.consignment_phone))) return send(200, { status: 0, error: "Invalid consignee phone" });
        const cn = `LE${++seq}7531`;
        parcels.set(cn, { courier: "LEOPARDS", text: "Pickup Request not Send", cod: Number(body.booked_packet_collect_amount), ref: String(body.booked_packet_order_id ?? ""), cancelled: false });
        return send(200, { status: 1, error: 0, track_number: cn, slip_link: `https://merchantapistaging.leopardscourier.com/slip/${cn}.pdf` });
      }
      if (method === "trackBookedPacket") {
        const cns = String(body.track_numbers ?? "").split(",").filter(Boolean);
        const list = cns.flatMap((cn) => {
          const p = parcels.get(cn);
          return p && p.courier === "LEOPARDS"
            ? [{ track_number: cn, booked_packet_status: p.text, booked_packet_collect_amount: p.cod, booked_packet_order_id: p.ref, "Tracking Detail": [{ Status: "Consignment Booked", Activity_datetime: "2026-10-17 10:00:00", Reason: null }, { Status: p.text, Activity_datetime: "2026-10-17 12:00:00", Reason: null }] }]
            : [];
        });
        return send(200, { status: 1, error: 0, packet_list: list });
      }
      if (method === "cancelBookedPackets") {
        const p = parcels.get(String(body.cn_numbers));
        if (!p) return send(200, { status: 0, error: "CN not found" });
        if (p.text !== "Pickup Request not Send") return send(200, { status: 0, error: "Packet already picked up" });
        p.cancelled = true;
        p.text = "Cancelled";
        return send(200, { status: 1, error: 0 });
      }
      return send(200, { status: 0, error: "Unknown method" });
    }

    // ---- PostEx: /postex/<version>/<method> with header token ----
    if (path.startsWith("/postex/")) {
      if (req.headers.token !== FAKE_POSTEX_TOKEN) return send(401, { statusCode: "401", statusMessage: "Unauthorized" });
      if (path === "/postex/v2/get-operational-city") return send(200, { statusCode: "200", statusMessage: "SUCCESSFULLY OPERATED", dist: FAKE_CITIES.map((c) => ({ operationalCityName: c.name, isDeliveryCity: true, isPickupCity: true })) });
      if (path === "/postex/v3/create-order" && req.method === "POST") {
        const required = ["orderRefNumber", "customerName", "customerPhone", "deliveryAddress", "cityName", "invoicePayment", "items", "orderType"];
        const missing = required.filter((k) => body?.[k] === undefined || body?.[k] === "");
        if (missing.length) return send(400, { statusCode: "400", statusMessage: `Missing ${missing.join(", ")}` });
        if (!FAKE_CITIES.some((c) => c.name === body!.cityName)) return send(400, { statusCode: "400", statusMessage: "Invalid city" });
        const cn = `2${++seq}55501`;
        parcels.set(cn, { courier: "POSTEX", text: "Unbooked", cod: Number(body!.invoicePayment), ref: String(body!.orderRefNumber), cancelled: false });
        return send(200, { statusCode: "200", statusMessage: "ORDER HAS BEEN CREATED", dist: { trackingNumber: cn, orderStatus: "Unbooked", orderDate: "2026-10-17 10:00:00" } });
      }
      const tr = /^\/postex\/v1\/track-order\/([A-Za-z0-9-]+)$/.exec(path);
      if (tr) {
        const p = parcels.get(tr[1]!.toUpperCase());
        if (!p || p.courier !== "POSTEX") return send(400, { statusCode: "400", statusMessage: "Tracking number not found" });
        return send(200, { statusCode: "200", statusMessage: "SUCCESSFULLY OPERATED", dist: { trackingNumber: tr[1], orderRefNumber: p.ref, invoicePayment: p.cod, transactionStatus: p.text, transactionStatusHistory: [{ transactionStatusMessage: "At Merchant's Warehouse", transactionStatusMessageCode: "0001", updatedAt: "2026-10-17 10:00:00" }, { transactionStatusMessage: p.text, transactionStatusMessageCode: "", updatedAt: "2026-10-17 12:00:00" }] } });
      }
      if (path === "/postex/v1/cancel-order" && req.method === "PUT") {
        const p = parcels.get(String(body?.trackingNumber));
        if (!p) return send(400, { statusCode: "400", statusMessage: "Tracking number not found" });
        if (p.text !== "Unbooked") return send(400, { statusCode: "400", statusMessage: "Order can not be cancelled" });
        p.cancelled = true;
        p.text = "Cancelled";
        return send(200, { statusCode: "200", statusMessage: "ORDER CANCELLED" });
      }
      if (path === "/postex/v1/get-invoice" || path === "/postex/v2/generate-load-sheet") {
        res.writeHead(200, { "content-type": "application/pdf" });
        return res.end(PDF);
      }
      return send(404, { statusCode: "404", statusMessage: "Not found" });
    }
    return send(404, {});
  });

  await new Promise<void>((ok) => server.listen(port, "127.0.0.1", ok));
  const actual = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${actual}`,
    server,
    parcels,
    requests,
    setStatus(cn, text) {
      const p = parcels.get(cn);
      if (p) p.text = text;
    },
    close: () => new Promise<void>((ok) => server.close(() => ok())),
  };
}

// Standalone for the browser walk-through
if (process.argv[1]?.endsWith("fake-courier.ts")) {
  const port = Number(process.argv[2] ?? 4010);
  void startFakeCourier(port).then((f) => console.log(`Fake courier on ${f.url}`));
}
