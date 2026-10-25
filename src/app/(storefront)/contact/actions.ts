"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { CONTACT_IP_LIMIT, notifyContactMessage, submitContactMessage } from "@/server/content/contact";
import { clientIp, rateLimit } from "@/server/rate-limit";

export type ContactState = { done?: boolean; error?: string };

/**
 * Contact form (spec §2). Rate-limited per address, honeypot field, shop-wide daily cap (see submitContactMessage).
 * The message is saved first; the email to the shop is sent after the response, so a slow Gmail never delays or loses it.
 */
export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const ip = clientIp(await headers());
  const limited = rateLimit(`contact:${ip}`, CONTACT_IP_LIMIT.max, CONTACT_IP_LIMIT.windowMs);
  if (!limited.ok) return { error: "You have sent several messages already. Please wait a while, or call or WhatsApp us." };

  const field = (k: string) => (typeof formData.get(k) === "string" ? (formData.get(k) as string) : "");
  const result = submitContactMessage(db, {
    name: field("name"),
    phone: field("phone"),
    email: field("email"),
    subject: field("subject"),
    message: field("message"),
    website: field("website"), // honeypot: real people never see this field
  });
  if (!result.ok) return { error: result.error };
  if (result.id && !result.duplicate && !result.dropped) {
    const id = result.id;
    after(() => notifyContactMessage(db, id));
  }
  return { done: true };
}
