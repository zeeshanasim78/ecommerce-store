import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { adminAuditLog, blogPosts, contactMessages, services, settings, testimonials, user } from "@/db/schema";
import { testDb } from "../helpers/db";
import { excerptOf, markdownToText, readingMinutes } from "@/lib/markdown-text";
import {
  ContentError,
} from "@/server/content/errors";
import {
  MIN_PUBLISH_CHARS, archivePost, cleanPostInput, getPublishedPost, listAdminPosts, listPublishedPosts, publishedPostSlugs, relatedPosts, savePost, setPostStatus,
} from "@/server/content/blog";
import {
  CONTACT_DAILY_CAP, composeContactEmail, contactRecipient, listMessages, messageCounts, newMessageCount, setMessageStatus, submitContactMessage,
} from "@/server/content/contact";
import { listActiveServices, listAllServices, moveService, saveService, setServiceActive, cleanServiceInput } from "@/server/content/services";
import {
  archiveTestimonial, cleanTestimonialInput, listAdminTestimonials, listPublishedTestimonials, moveTestimonial, saveTestimonial, setTestimonialPublished,
} from "@/server/content/testimonials";
import { absoluteUrl, blogPostingLd, breadcrumbLd, faqLd, jsonLdString, organizationLd, productLd } from "@/server/content/seo";
import { faqGroups } from "@/server/content/faq";
import { isLocalSite, siteUrl } from "@/server/site-url";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { ArticleMarkdown } from "@/components/store/article-markdown";

const ctx = { ip: "127.0.0.1", userAgent: "test" };
const BODY = "Choosing a screen starts with the exact model code of the phone. ".repeat(3);
let db: DB;
let editor: string;

const input = (over: Partial<Parameters<typeof cleanPostInput>[0]> = {}) =>
  cleanPostInput({ title: "How to choose a screen", bodyMd: BODY, status: "DRAFT", ...over }) as Parameters<typeof savePost>[4];

beforeEach(() => {
  db = testDb();
  editor = "editor-1";
  db.insert(user).values({ id: editor, name: "Editor", email: "editor@example.com", role: "CONTENT_EDITOR", isActive: true }).run();
});

describe("markdown text helpers", () => {
  it("turns Markdown into plain text and cuts excerpts at a word", () => {
    const md = "## Heading\n\nSome **bold** and *italic* text with a [link](https://x.test) and `code`.\n\n- one\n- two";
    expect(markdownToText(md)).toBe("Heading Some bold and italic text with a link and code. one two");
    const long = "word ".repeat(100);
    const cut = excerptOf(long, 50);
    expect(cut.length).toBeLessThanOrEqual(50);
    expect(cut.endsWith("…")).toBe(true);
    expect(excerptOf("short", 50)).toBe("short");
    expect(readingMinutes("a ".repeat(450))).toBe(2);
    expect(readingMinutes("tiny")).toBe(1);
  });
});

describe("blog — writing and publishing", () => {
  it("saves a draft with an address made from the title; drafts are not public", () => {
    const { id, slug } = savePost(db, ctx, editor, null, input());
    expect(slug).toBe("how-to-choose-a-screen");
    expect(getPublishedPost(db, slug)).toBeUndefined();
    expect(listPublishedPosts(db).posts).toHaveLength(0);
    expect(publishedPostSlugs(db)).toEqual([]);
    const row = db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()!;
    expect(row.status).toBe("DRAFT");
    expect(row.authorId).toBe(editor);
    expect(row.publishedAt).toBeNull();
  });

  it("a published post appears on the blog and in the sitemap list at once (M13 done-when)", () => {
    const { id, slug } = savePost(db, ctx, editor, null, input());
    setPostStatus(db, ctx, editor, id, "PUBLISHED");
    expect(getPublishedPost(db, slug)?.title).toBe("How to choose a screen");
    expect(listPublishedPosts(db).posts.map((p) => p.slug)).toEqual([slug]);
    expect(publishedPostSlugs(db).map((p) => p.slug)).toEqual([slug]);
    setPostStatus(db, ctx, editor, id, "DRAFT");
    expect(listPublishedPosts(db).posts).toHaveLength(0);
    expect(publishedPostSlugs(db)).toEqual([]);
  });

  it("keeps the first publish date when unpublished and published again", () => {
    const t0 = new Date("2026-10-01T06:00:00Z");
    const { id } = savePost(db, ctx, editor, null, input({ status: "PUBLISHED" }), t0);
    setPostStatus(db, ctx, editor, id, "DRAFT", new Date("2026-10-02T06:00:00Z"));
    setPostStatus(db, ctx, editor, id, "PUBLISHED", new Date("2026-10-03T06:00:00Z"));
    expect(db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()!.publishedAt).toBe(t0.toISOString());
  });

  it("a post dated in the future stays hidden until its time", () => {
    const { id, slug } = savePost(db, ctx, editor, null, input({ status: "PUBLISHED" }), new Date("2026-12-01T00:00:00Z"));
    expect(id).toBeTruthy();
    expect(getPublishedPost(db, slug, new Date("2026-11-30T00:00:00Z"))).toBeUndefined();
    expect(getPublishedPost(db, slug, new Date("2026-12-01T00:00:01Z"))).toBeDefined();
  });

  it("refuses to publish a near-empty post, bad input and duplicate addresses with plain messages", () => {
    expect(() => savePost(db, ctx, editor, null, input({ bodyMd: "Too short", status: "PUBLISHED" }))).toThrow(new RegExp(`${MIN_PUBLISH_CHARS}`));
    expect(() => savePost(db, ctx, editor, null, input({ title: "ab" }))).toThrow(ContentError);
    expect(() => savePost(db, ctx, editor, null, input({ coverImage: "javascript:alert(1)" }))).toThrow(/cover image/);
    expect(() => savePost(db, ctx, editor, null, input({ tags: "a,b,c,d,e,f,g,h,i" }))).toThrow(/8 tags/);
    savePost(db, ctx, editor, null, input({ slug: "same-address" }));
    expect(() => savePost(db, ctx, editor, null, input({ title: "Another", slug: "same-address" }))).toThrow(/already uses that web address/);
    expect(() => savePost(db, ctx, editor, null, input({ title: "Third", slug: "Bad Address!" }))).toThrow(/web address/);
    expect(() => setPostStatus(db, ctx, editor, "missing", "PUBLISHED")).toThrow(/no longer exists/);
  });

  it("two posts with the same title get different addresses; editing keeps the address", () => {
    const a = savePost(db, ctx, editor, null, input());
    const b = savePost(db, ctx, editor, null, input());
    expect(a.slug).toBe("how-to-choose-a-screen");
    expect(b.slug).toBe("how-to-choose-a-screen-2");
    const edited = savePost(db, ctx, editor, b.id, input({ title: "A totally new title" }));
    expect(edited.slug).toBe("how-to-choose-a-screen-2");
  });

  it("cleans tags (lower-case, trimmed, no repeats) and strips control characters from one-line fields", () => {
    const c = cleanPostInput({ title: "Hi\u0000 there\nfriend", bodyMd: BODY, tags: " OLED , oled,Fitting ,, ", status: "DRAFT" });
    expect(c.title).toBe("Hi there friend");
    expect(c.tags).toEqual(["oled", "fitting"]);
  });

  it("archived posts vanish everywhere, can be restored as drafts, and every change is audited", () => {
    const { id, slug } = savePost(db, ctx, editor, null, input({ status: "PUBLISHED" }));
    archivePost(db, ctx, editor, id, true);
    expect(getPublishedPost(db, slug)).toBeUndefined();
    expect(listAdminPosts(db, "all")).toHaveLength(0);
    expect(listAdminPosts(db, "archived")).toHaveLength(1);
    expect(() => setPostStatus(db, ctx, editor, id, "PUBLISHED")).toThrow(/Restore/);
    archivePost(db, ctx, editor, id, false);
    expect(listAdminPosts(db, "draft")).toHaveLength(1);
    expect(getPublishedPost(db, slug)).toBeUndefined();
    const actions = db.select().from(adminAuditLog).where(eq(adminAuditLog.entity, "blog_posts")).all().map((a) => a.action);
    expect(actions).toEqual(["blog.create_published", "blog.archive", "blog.restore"]);
  });

  it("lists newest first, filters by tag, pages, and offers related posts by shared tags", () => {
    const mk = (title: string, tags: string, day: number) =>
      savePost(db, ctx, editor, null, input({ title, tags, status: "PUBLISHED" }), new Date(Date.UTC(2026, 9, day, 6)));
    const a = mk("Alpha", "oled,fitting", 1);
    mk("Bravo", "lcd", 2);
    mk("Charlie", "oled", 3);
    const list = listPublishedPosts(db, { pageSize: 2 });
    expect(list.posts.map((p) => p.title)).toEqual(["Charlie", "Bravo"]);
    expect(list.pages).toBe(2);
    expect(listPublishedPosts(db, { pageSize: 2, page: 2 }).posts.map((p) => p.title)).toEqual(["Alpha"]);
    expect(listPublishedPosts(db, { pageSize: 2, page: 99 }).page).toBe(2);
    expect(listPublishedPosts(db, { tag: "OLED" }).posts.map((p) => p.title)).toEqual(["Charlie", "Alpha"]);
    expect(list.tags[0]).toEqual({ name: "oled", count: 2 });
    const post = db.select().from(blogPosts).where(eq(blogPosts.id, a.id)).get()!;
    expect(relatedPosts(db, post, 2).map((p) => p.title)).toEqual(["Charlie", "Bravo"]);
  });

  it("uses the start of the text when no summary is written", () => {
    const { id } = savePost(db, ctx, editor, null, input({ status: "PUBLISHED", excerpt: "" }));
    const card = listPublishedPosts(db).posts.find((p) => p.id === id)!;
    expect(card.excerpt.startsWith("Choosing a screen starts")).toBe(true);
    expect(card.minutes).toBe(1);
  });
});

describe("blog — Markdown is rendered safely", () => {
  const render = (md: string) => renderToStaticMarkup(React.createElement(ArticleMarkdown, null, md));

  it("drops raw HTML, scripts, event handlers and dangerous links", () => {
    const html = render(
      [
        "<script>alert(1)</script>",
        "<img src=x onerror=alert(1)>",
        "[bad](javascript:alert(1)) [data](data:text/html,x) [protocol-relative](//evil.test)",
        "![pic](javascript:alert(2))",
        "<iframe src='https://evil.test'></iframe>",
        "[ok](https://example.com) [here](/store)",
      ].join("\n\n"),
    );
    expect(html).not.toMatch(/<script|onerror|javascript:|data:text|<iframe|\/\/evil/i);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('href="/store"');
  });

  it("keeps headings (a # becomes an h2), lists, quotes and uploaded images", () => {
    const html = render("# Top\n\n### Sub\n\n- a\n- b\n\n> quote\n\n![A screen](/uploads/blog/x.webp)");
    expect(html).toContain("<h2>Top</h2>");
    expect(html).toContain("<h3>Sub</h3>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain('<img src="/uploads/blog/x.webp" alt="A screen"');
    expect(html).not.toContain("<h1");
  });
});

describe("testimonials", () => {
  const t = (over = {}) => cleanTestimonialInput({ authorName: "Ali Raza", authorRole: "Repair shop owner", city: "Lahore", rating: "5", quote: "Screens arrive well packed and the grade is exactly as described.", isPublished: false, ...over });

  it("only published, non-archived testimonials are public, in the chosen order", () => {
    const a = saveTestimonial(db, ctx, editor, null, t({ authorName: "Amir", isPublished: true }));
    const b = saveTestimonial(db, ctx, editor, null, t({ authorName: "Bashir", isPublished: true }));
    saveTestimonial(db, ctx, editor, null, t({ authorName: "Chand" }));
    expect(listPublishedTestimonials(db).map((x) => x.authorName)).toEqual(["Amir", "Bashir"]);
    moveTestimonial(db, ctx, editor, b, "up");
    expect(listPublishedTestimonials(db).map((x) => x.authorName)).toEqual(["Bashir", "Amir"]);
    moveTestimonial(db, ctx, editor, b, "up"); // already first: nothing happens
    expect(listAdminTestimonials(db).map((x) => x.authorName)).toEqual(["Bashir", "Amir", "Chand"]);
    archiveTestimonial(db, ctx, editor, a, true);
    expect(listPublishedTestimonials(db).map((x) => x.authorName)).toEqual(["Bashir"]);
    expect(listAdminTestimonials(db, true).map((x) => x.authorName)).toEqual(["Amir"]);
    expect(() => setTestimonialPublished(db, ctx, editor, a, true)).toThrow(/Restore/);
    archiveTestimonial(db, ctx, editor, a, false);
    expect(listPublishedTestimonials(db).map((x) => x.authorName)).toEqual(["Bashir"]); // restored hidden
    setTestimonialPublished(db, ctx, editor, a, true);
    expect(listPublishedTestimonials(db)).toHaveLength(2);
  });

  it("validates rating, name and quote", () => {
    expect(() => saveTestimonial(db, ctx, editor, null, t({ rating: "6" }))).toThrow(/1 to 5/);
    expect(() => saveTestimonial(db, ctx, editor, null, t({ authorName: "A" }))).toThrow(/name/);
    expect(() => saveTestimonial(db, ctx, editor, null, t({ quote: "Short" }))).toThrow(/at least 10/);
    expect(() => saveTestimonial(db, ctx, editor, null, t({ quote: "x".repeat(900) }))).toThrow(/600/);
    expect(saveTestimonial(db, ctx, editor, null, t({ rating: "" }))).toBeTruthy();
    expect(db.select().from(testimonials).all().find((x) => x.rating === null)).toBeDefined();
  });
});

describe("services", () => {
  const s = (over = {}) => cleanServiceInput({ title: "Bulk supply", summary: "Pallets of screens for chains of repair shops.", isActive: true, icon: "wholesale", ...over });

  it("adds, hides, reorders and rejects bad input; unknown icons become none", () => {
    const base = listAllServices(db).length;
    expect(base).toBe(0);
    const a = saveService(db, ctx, editor, null, s());
    const b = saveService(db, ctx, editor, null, s({ title: "Screen fitting", icon: "nonsense" }));
    expect(db.select().from(services).where(eq(services.id, b)).get()).toMatchObject({ slug: "screen-fitting", icon: null });
    expect(saveService(db, ctx, editor, null, s())).toBeTruthy();
    expect(db.select().from(services).all().map((x) => x.slug)).toEqual(["bulk-supply", "screen-fitting", "bulk-supply-2"]);
    moveService(db, ctx, editor, b, "up");
    expect(listAllServices(db).map((x) => x.title).slice(0, 2)).toEqual(["Screen fitting", "Bulk supply"]);
    setServiceActive(db, ctx, editor, a, false);
    expect(listActiveServices(db).map((x) => x.id)).not.toContain(a);
    expect(() => saveService(db, ctx, editor, null, s({ title: "x" }))).toThrow(/title/);
    expect(() => saveService(db, ctx, editor, null, s({ summary: "short" }))).toThrow(/summary/);
    expect(() => setServiceActive(db, ctx, editor, "missing", true)).toThrow(/no longer exists/);
  });
});

describe("contact form", () => {
  const msg = (over = {}) => ({ name: "Bilal Ahmed", phone: "0300 1234567", email: "", subject: "Order question", message: "Where is my parcel? I ordered three days ago.", ...over });

  it("stores a valid message with a normalised phone number", () => {
    const r = submitContactMessage(db, msg());
    expect(r.ok).toBe(true);
    const row = db.select().from(contactMessages).all()[0]!;
    expect(row).toMatchObject({ name: "Bilal Ahmed", phone: "+923001234567", email: null, status: "NEW" });
    expect(newMessageCount(db)).toBe(1);
  });

  it("silently drops the honeypot (bots) without storing anything", () => {
    const r = submitContactMessage(db, msg({ website: "https://spam.test" }));
    expect(r).toEqual({ ok: true, id: null, dropped: true });
    expect(db.select().from(contactMessages).all()).toHaveLength(0);
  });

  it("needs a way to reply, and checks each field with a plain message", () => {
    const bad = (over: object) => submitContactMessage(db, msg(over));
    expect(bad({ phone: "", email: "" })).toMatchObject({ ok: false, error: expect.stringMatching(/phone number or an email/) });
    expect(bad({ phone: "abc" })).toMatchObject({ ok: false, error: expect.stringMatching(/phone/) });
    expect(bad({ email: "not-an-email", phone: "" })).toMatchObject({ ok: false, error: expect.stringMatching(/email/) });
    expect(bad({ name: "A" })).toMatchObject({ ok: false });
    expect(bad({ message: "short" })).toMatchObject({ ok: false, error: expect.stringMatching(/at least 10/) });
    expect(bad({ message: "x".repeat(2500) })).toMatchObject({ ok: true }); // cut to 2,000, not refused
    expect(db.select().from(contactMessages).all()[0]!.message).toHaveLength(2000);
    expect(bad({ phone: "", email: "a@b.pk" })).toMatchObject({ ok: true });
  });

  it("stores an identical repeat once, and stops at the shop-wide daily cap", () => {
    const first = submitContactMessage(db, msg());
    const again = submitContactMessage(db, msg());
    expect(again).toMatchObject({ ok: true, duplicate: true });
    expect(first.ok && again.ok && first.id === again.id).toBe(true);
    expect(db.select().from(contactMessages).all()).toHaveLength(1);
    for (let i = 1; i < CONTACT_DAILY_CAP; i++) expect(submitContactMessage(db, msg({ message: `Different question number ${i} about screens` })).ok).toBe(true);
    const over = submitContactMessage(db, msg({ message: "One message too many for today please" }));
    expect(over).toMatchObject({ ok: false, error: expect.stringMatching(/call or WhatsApp/) });
  });

  it("never stores markup as anything but text, and keeps line breaks in the message", () => {
    submitContactMessage(db, msg({ name: "<b>Bad</b>\nname", message: "Line one\r\nLine two <script>alert(1)</script>" }));
    const row = db.select().from(contactMessages).all()[0]!;
    expect(row.name).toBe("<b>Bad</b> name"); // one line; React escapes it when shown
    expect(row.message).toBe("Line one\nLine two <script>alert(1)</script>");
  });

  it("admin: counts, filters and status changes are audited; the email text holds no secrets", () => {
    const id = (submitContactMessage(db, msg()) as { id: string }).id;
    submitContactMessage(db, msg({ message: "A second question about a Redmi screen" }));
    expect(messageCounts(db)).toEqual({ NEW: 2, REPLIED: 0, SPAM: 0 });
    setMessageStatus(db, ctx, editor, id, "REPLIED");
    setMessageStatus(db, ctx, editor, id, "REPLIED"); // double click: no second audit row
    expect(messageCounts(db)).toEqual({ NEW: 1, REPLIED: 1, SPAM: 0 });
    expect(listMessages(db, "REPLIED").map((m) => m.id)).toEqual([id]);
    expect(listMessages(db, "ALL")).toHaveLength(2);
    const row = db.select().from(contactMessages).where(eq(contactMessages.id, id)).get()!;
    expect(row.handledBy).toBe(editor);
    expect(db.select().from(adminAuditLog).where(eq(adminAuditLog.entity, "contact_messages")).all()).toHaveLength(1);
    expect(() => setMessageStatus(db, ctx, editor, "missing", "SPAM")).toThrow(/no longer exists/);
    const mail = composeContactEmail({ ...row, name: "Eve\nBcc: x@y.z" }, { BETTER_AUTH_URL: "https://caidea.pk" });
    expect(mail.subject).not.toMatch(/\n/);
    expect(mail.text).toContain("https://caidea.pk/admin/messages");
    expect(mail.text).toContain(row.message);
  });

  it("tells the sales email first, else the alert address", () => {
    expect(contactRecipient(db, {})).toBeNull();
    expect(contactRecipient(db, { ALERT_EMAIL_TO: "Owner@Shop.pk, other@x.pk" })).toBe("owner@shop.pk");
    db.insert(settings).values({ key: "sales_email", value: "sales@shop.pk" }).run();
    expect(contactRecipient(db, { ALERT_EMAIL_TO: "owner@shop.pk" })).toBe("sales@shop.pk");
  });
});

describe("search-engine data", () => {
  const SITE = "https://caidea.pk";

  it("site address comes from the environment file only, and localhost is recognised", () => {
    expect(siteUrl({ BETTER_AUTH_URL: "https://caidea.pk/" })).toBe(SITE);
    expect(isLocalSite({})).toBe(true);
    expect(isLocalSite({ BETTER_AUTH_URL: "http://localhost:3000" })).toBe(true);
    expect(isLocalSite({ BETTER_AUTH_URL: SITE })).toBe(false);
  });

  it("JSON for a script tag can never close the tag or break the line", () => {
    const out = jsonLdString({ a: "</script><script>alert(1)</script>", b: "x\u2028y", c: "a&b>c" });
    expect(out).not.toMatch(/[<>&\u2028\u2029]/);
    expect(JSON.parse(out)).toEqual({ a: "</script><script>alert(1)</script>", b: "x\u2028y", c: "a&b>c" });
    const html = renderToStaticMarkup(React.createElement("script", { type: "application/ld+json" }, out));
    expect(html.match(/<\/script/g)).toHaveLength(1);
  });

  it("absolute addresses accept this site's paths and https only", () => {
    expect(absoluteUrl(SITE, "/uploads/a.webp")).toBe(`${SITE}/uploads/a.webp`);
    expect(absoluteUrl(SITE, "https://cdn.test/a.webp")).toBe("https://cdn.test/a.webp");
    expect(absoluteUrl(SITE, "javascript:alert(1)")).toBeUndefined();
    expect(absoluteUrl(SITE, "//evil.test/a")).toBeUndefined();
    expect(absoluteUrl(SITE, null)).toBeUndefined();
  });

  it("Organization lists only contact details that are set", () => {
    const full = organizationLd(SITE, { name: "Caidea", phone: "+923001234567", whatsapp: null, salesEmail: "sales@caidea.pk" }) as Record<string, unknown>;
    expect(full).toMatchObject({ "@type": "Organization", url: SITE, email: "sales@caidea.pk", contactPoint: [{ telephone: "+923001234567" }] });
    const bare = organizationLd(SITE, { name: "Caidea", phone: null, whatsapp: null, salesEmail: null });
    expect(bare).not.toHaveProperty("contactPoint");
    expect(bare).not.toHaveProperty("email");
  });

  it("Product carries the real price in rupees, PKR, stock state and absolute images", () => {
    const ld = productLd(SITE, {
      slug: "galaxy-s23-ultra-oem", brand: "Samsung", model: "Galaxy S23 Ultra", qualityGrade: "OEM Original", displayType: "AMOLED", description: null, totalStock: 0,
      images: [{ url: "/uploads/products/a.webp", alt: "", angle: "FRONT", variantId: null }],
      price: { originalPaisa: 6_850_000, finalPaisa: 6_850_000, isDiscounted: false, savingPaisa: 0, percentOff: 0, source: null, promotion: null } as never,
    }) as { offers: Record<string, unknown>; image: string[]; name: string };
    expect(ld.name).toBe("Samsung Galaxy S23 Ultra OEM Original screen");
    expect(ld.image).toEqual([`${SITE}/uploads/products/a.webp`]);
    expect(ld.offers).toMatchObject({ priceCurrency: "PKR", price: "68500.00", availability: "https://schema.org/OutOfStock", url: `${SITE}/store/galaxy-s23-ultra-oem` });
  });

  it("BlogPosting, breadcrumbs and FAQ are well formed", () => {
    const post = blogPostingLd(SITE, { slug: "x", title: "T".repeat(150), description: "d", coverImage: null, publishedAt: "2026-10-01T00:00:00.000Z", updatedAt: null, orgName: "Caidea" }) as Record<string, unknown>;
    expect((post.headline as string).length).toBe(110);
    expect(post).toMatchObject({ "@type": "BlogPosting", datePublished: "2026-10-01T00:00:00.000Z", dateModified: "2026-10-01T00:00:00.000Z" });
    expect(post).not.toHaveProperty("image");
    expect(breadcrumbLd(SITE, [{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])).toMatchObject({ itemListElement: [{ position: 1, item: `${SITE}/` }, { position: 2, item: `${SITE}/blog` }] });
    expect(faqLd([{ q: "Q?", a: "A." }])).toMatchObject({ "@type": "FAQPage", mainEntity: [{ name: "Q?", acceptedAnswer: { text: "A." } }] });
  });

  it("FAQ answers quote the live shop rules (COD limit, free delivery, paused COD)", () => {
    const facts = { name: "Caidea", phone: "+923001234567", whatsapp: null, whatsappUrl: null, salesEmail: null, codLimit: "Rs 20,000", freeDeliveryWhenPrepaid: true, codPaused: false, etaMin: 2, etaMax: 5, cities: 8 };
    const text = (f = facts) => faqGroups(f, "2–5 working days after dispatch").flatMap((g) => g.items.map((i) => `${i.q} ${i.a}`)).join("\n");
    expect(text()).toContain("up to Rs 20,000");
    expect(text()).toContain("free delivery");
    expect(text()).toContain("within 7 days");
    expect(text()).toContain("within 24 hours");
    expect(text({ ...facts, freeDeliveryWhenPrepaid: false })).not.toContain("get free delivery");
    expect(text({ ...facts, codPaused: true })).toContain("paused");
  });
});
