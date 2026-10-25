import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { Section, Textarea } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { Post } from "@/server/content/blog";
import { savePostAction } from "./actions";

/** Shared form for writing and editing a blog post. Plain form → Server Action; only the preview needs JavaScript. */
export function PostForm({ post }: { post?: Post }) {
  return (
    <form action={savePostAction} className="flex flex-col gap-6">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <Section title="The post">
        <Field id="title" label="Title">
          <Input id="title" name="title" required minLength={3} maxLength={120} defaultValue={post?.title} />
        </Field>
        <Field id="excerpt" label="Summary (optional)" hint="Shown on the blog list. Left empty, the first lines of the post are used. Up to 300 characters.">
          <Textarea id="excerpt" name="excerpt" maxLength={300} className="min-h-20" defaultValue={post?.excerpt ?? ""} aria-describedby="excerpt-hint" />
        </Field>
        <div>
          <label htmlFor="bodyMd" className="mb-2 block pl-1 text-sm font-semibold">
            Text
          </label>
          <MarkdownEditor name="bodyMd" defaultValue={post?.bodyMd ?? ""} />
        </div>
      </Section>

      <Section title="Picture and topics">
        {post?.coverImage ? (
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail */}
            <img src={post.coverImage} alt="Current cover" className="h-24 w-40 rounded-bezel-sm object-cover" />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="removeCover" /> Remove the cover picture
            </label>
            <input type="hidden" name="coverImage" value={post.coverImage} />
          </div>
        ) : null}
        <Field id="coverFile" label={post?.coverImage ? "Replace the cover picture" : "Cover picture (optional)"} hint="JPG, PNG, WebP or AVIF up to 5 MB, ideally wide (16:9). Converted to WebP automatically.">
          <input
            id="coverFile"
            name="coverFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="rounded-full border border-midnight/18 bg-white px-4 py-2 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-midnight file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-canvas"
          />
        </Field>
        <Field id="tags" label="Topics" hint="Separate with commas, e.g. fitting, oled, buying guide. Up to 8.">
          <Input id="tags" name="tags" defaultValue={post?.tags.join(", ") ?? ""} aria-describedby="tags-hint" />
        </Field>
      </Section>

      <Section title="Search engines" description="Optional. Left empty, the title and summary are used.">
        <Field id="slug" label="Web address" hint={post ? "Changing this breaks links that already point to the post." : "Left empty, it is made from the title. Lower-case letters, numbers and hyphens."}>
          <Input id="slug" name="slug" maxLength={96} defaultValue={post?.slug ?? ""} aria-describedby="slug-hint" />
        </Field>
        <Field id="seoTitle" label="Title in search results" hint="Up to 70 characters.">
          <Input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={post?.seoTitle ?? ""} aria-describedby="seoTitle-hint" />
        </Field>
        <Field id="seoDescription" label="Description in search results" hint="Up to 170 characters.">
          <Textarea id="seoDescription" name="seoDescription" maxLength={170} className="min-h-20" defaultValue={post?.seoDescription ?? ""} aria-describedby="seoDescription-hint" />
        </Field>
      </Section>

      <Section title="Visibility">
        <Field id="status" label="Status" hint="Drafts are visible only here. Published posts appear on the blog and in the sitemap straight away.">
          <Select id="status" name="status" defaultValue={post?.status ?? "DRAFT"} aria-describedby="status-hint">
            <option value="DRAFT">Draft — hidden</option>
            <option value="PUBLISHED">Published — live on the blog</option>
          </Select>
        </Field>
      </Section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">
          {post ? "Save changes" : "Save post"}
        </Button>
        <ButtonLink href="/admin/blog" variant="ghost" size="lg">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
