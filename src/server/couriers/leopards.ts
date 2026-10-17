import { readCourierConfig, courierSecrets } from "./config";
import { asArray, clean, courierRequest, pick } from "./http";
import { CourierError, classifyStatus, codRupees, type BookingInput, type CourierProvider, type FetchLike, type TrackingResult } from "./types";

/**
 * Leopards Courier merchant API (https://merchantapi.leopardscourier.com/api/, staging:
 * merchantapistaging…). Every call is a POST to `<method>/format/json/` with api_key + api_password
 * in the JSON body; replies carry `status: 1` on success or `status: 0` + `error`.
 * Field names follow Leopards' merchant API as used by its published client libraries
 * (bookPacket → track_number + slip_link; trackBookedPacket → packet_list[].booked_packet_status
 * and "Tracking Detail"; getAllCities → city_list[].id/name; cancelBookedPackets → cn_numbers).
 * The shipper details are "self" — Leopards fills them from the merchant account.
 */
export function leopardsProvider(env: Record<string, string | undefined> = process.env, fetchImpl: FetchLike = fetch): CourierProvider {
  const cfg = readCourierConfig("LEOPARDS", env);
  const { apiKey, apiPassword } = courierSecrets("LEOPARDS", env) as { apiKey: string; apiPassword: string };

  async function call(method: string, payload: Record<string, unknown>) {
    if (!cfg.configured) throw new CourierError("Leopards isn’t set up: add LEOPARDS_API_KEY and LEOPARDS_API_PASSWORD to the environment file and restart.", "LEOPARDS");
    const body = (await courierRequest("LEOPARDS", fetchImpl, `${cfg.baseUrl}${method}/format/json/`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ api_key: apiKey, api_password: apiPassword, ...payload }),
    })) as Record<string, unknown>;
    const status = pick(body, "status");
    if (status === 0 || status === "0" || status === false) {
      const err = pick(body, "error", "message");
      throw new CourierError(`Leopards: ${clean(typeof err === "string" ? err : JSON.stringify(err ?? "request refused"))}`, "LEOPARDS");
    }
    return body;
  }

  return {
    id: "LEOPARDS",

    async cities() {
      const body = await call("getAllCities", {});
      return asArray(pick(body, "city_list", "cities"))
        .map((c) => ({ code: String(pick(c, "id", "city_id") ?? ""), name: clean(pick(c, "name", "city_name"), 80) }))
        .filter((c) => c.code && c.name);
    },

    async book(input: BookingInput) {
      const body = await call("bookPacket", {
        booked_packet_weight: input.weightGrams,
        booked_packet_no_piece: input.pieces,
        booked_packet_collect_amount: codRupees(input.codPaisa),
        booked_packet_order_id: input.orderCode,
        origin_city: "self",
        destination_city: Number.isFinite(Number(input.city.code)) ? Number(input.city.code) : input.city.code,
        shipment_id: "self",
        shipment_name_eng: "self",
        shipment_email: "self",
        shipment_phone: "self",
        shipment_address: "self",
        consignment_name_eng: input.name,
        consignment_email: input.email ?? "",
        consignment_phone: input.phone,
        consignment_address: input.address,
        special_instructions: input.instructions,
        shipment_type: "overnight",
      });
      const cn = clean(pick(body, "track_number", "cn_number"), 40).toUpperCase();
      if (!/^[A-Z0-9-]{4,40}$/.test(cn)) throw new CourierError("Leopards accepted the booking but sent no tracking number — check the Leopards portal before booking again.", "LEOPARDS");
      const slip = pick(body, "slip_link");
      return { cn, labelUrl: typeof slip === "string" && /^https:\/\//.test(slip) ? slip : null };
    },

    async track(cns: string[]) {
      const out = new Map<string, TrackingResult>();
      for (let i = 0; i < cns.length; i += 50) {
        const batch = cns.slice(i, i + 50);
        const body = await call("trackBookedPacket", { track_numbers: batch.join(",") });
        for (const p of asArray(pick(body, "packet_list", "packets"))) {
          const cn = clean(pick(p, "track_number", "cn_number"), 40).toUpperCase();
          if (!cn) continue;
          const events = asArray(pick(p, "Tracking Detail", "tracking_detail")).map((e) => ({
            at: (pick(e, "Activity_datetime", "activity_date", "date") as string | undefined) ?? null,
            text: clean([pick(e, "Status", "status"), pick(e, "Reason", "reason")].filter(Boolean).join(" — ")),
          }));
          const text = clean(pick(p, "booked_packet_status", "status")) || events.at(-1)?.text || "";
          out.set(cn, { cn, status: classifyStatus(text), text, events });
        }
      }
      return out;
    },

    async cancel(cn: string) {
      await call("cancelBookedPackets", { cn_numbers: cn });
    },
  };
}
