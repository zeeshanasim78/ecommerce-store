import Image from "next/image";
import Link from "next/link";
import { formatKarachi } from "@/lib/time";
import type { PostCard as PostCardData } from "@/server/content/blog";

const dateOnly = (iso: string | null) => (iso ? formatKarachi(iso).replace(/,?\s+\d{1,2}:\d{2}.*$/i, "") : "");

export function PostDate({ iso }: { iso: string | null }) {
  return iso ? <time dateTime={iso}>{dateOnly(iso)}</time> : null;
}

/** Blog list card: cover image (or a plain panel), tags, title, summary. */
export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-bezel bg-white ring-1 ring-midnight/8 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(11_28_51/0.45)]">
      <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true" className="block aspect-[16/9] overflow-hidden bg-surface">
        {post.coverImage?.startsWith("/uploads/") ? (
          <Image src={post.coverImage} alt="" width={800} height={450} sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- external https cover chosen by the admin; next/image is limited to this site's uploads
          <img src={post.coverImage} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center bg-midnight font-display text-4xl font-bold text-canvas/25">Caidea</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm text-midnight/60">
          <PostDate iso={post.publishedAt} /> · {post.minutes} min read
        </p>
        <h2 className="mt-2 font-display text-xl leading-snug font-bold tracking-[-0.01em]">
          <Link href={`/blog/${post.slug}`} className="hover:underline hover:underline-offset-4">
            {post.title}
          </Link>
        </h2>
        <p className="mt-2 flex-1 leading-relaxed text-midnight/75">{post.excerpt}</p>
        {post.tags.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((t) => (
              <li key={t} className="rounded-full bg-surface px-3 py-1 text-xs font-semibold">
                {t}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
