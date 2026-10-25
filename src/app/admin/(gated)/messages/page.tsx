import Link from "next/link";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { db } from "@/db/client";
import { cn } from "@/lib/cn";
import { formatKarachi } from "@/lib/time";
import { listMessages, messageCounts, type MessageFilter } from "@/server/content/contact";
import { requireStaff } from "@/server/dal";
import { setMessageStatusAction } from "./actions";

export const metadata = { title: "Messages" };

const VIEWS: { key: MessageFilter; label: string }[] = [
  { key: "NEW", label: "New" },
  { key: "REPLIED", label: "Answered" },
  { key: "SPAM", label: "Spam" },
  { key: "ALL", label: "All" },
];

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ show?: string; saved?: string; error?: string }> }) {
  await requireStaff("messages");
  const { show, saved, error } = await searchParams;
  const view = VIEWS.some((v) => v.key === show) ? (show as MessageFilter) : "NEW";
  const counts = messageCounts(db);
  const total = counts.NEW + counts.REPLIED + counts.SPAM;
  const messages = listMessages(db, view);
  const countOf = (k: MessageFilter) => (k === "ALL" ? total : counts[k]);

  return (
    <>
      <AdminHeader title="Messages" description="Sent through the Contact page. Reply by phone, WhatsApp or email, then mark the message answered." />
      {saved ? <Notice>{saved}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <nav aria-label="Filter messages" className="mb-6 flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <Link key={v.key} href={v.key === "NEW" ? "/admin/messages" : `/admin/messages?show=${v.key}`} className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold", view === v.key ? "bg-midnight text-canvas" : "bg-surface hover:bg-midnight/10")}>
            {v.label} <span className="tabular ml-1.5 opacity-60">{countOf(v.key)}</span>
          </Link>
        ))}
      </nav>

      {messages.length === 0 ? (
        <p className="text-midnight/70">{view === "NEW" ? "No new messages." : "Nothing here."}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-bezel bg-white p-6 ring-1 ring-midnight/8">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-semibold">
                  {m.name} {m.subject ? <span className="font-normal text-midnight/65">— {m.subject}</span> : null}
                </p>
                <p className="tabular text-sm text-midnight/60">{formatKarachi(m.createdAt)}</p>
              </div>
              {/* whitespace-pre-wrap keeps the customer's line breaks; React escapes the text itself */}
              <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed">{m.message}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                {m.phone ? <a href={`tel:${m.phone}`} className="tabular font-semibold underline underline-offset-4">{m.phone}</a> : null}
                {m.phone?.startsWith("+") ? (
                  <a href={`https://wa.me/${m.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">WhatsApp</a>
                ) : null}
                {m.email ? <a href={`mailto:${m.email}`} className="font-semibold break-all underline underline-offset-4">{m.email}</a> : null}
                {m.status !== "NEW" && m.handledAt ? <span className="text-midnight/60">{m.status === "SPAM" ? "Marked spam" : "Answered"} {formatKarachi(m.handledAt)}</span> : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-midnight/8 pt-4">
                {(["REPLIED", "SPAM", "NEW"] as const)
                  .filter((s) => s !== m.status)
                  .map((s) => (
                    <form key={s} action={setMessageStatusAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="status" value={s} />
                      <input type="hidden" name="view" value={view} />
                      <button type="submit" className={buttonClasses(s === "REPLIED" ? "primary" : "outline", "sm")}>
                        {s === "REPLIED" ? "Mark answered" : s === "SPAM" ? "Spam" : "Move back to new"}
                      </button>
                    </form>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
