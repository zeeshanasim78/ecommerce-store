import { Section, Textarea, Toggle } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { Testimonial } from "@/server/content/testimonials";
import { saveTestimonialAction } from "./actions";

export function TestimonialForm({ item }: { item?: Testimonial }) {
  return (
    <form action={saveTestimonialAction} className="flex flex-col gap-6">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Section title="What the customer said" description="Only publish words a real customer gave you, with their permission.">
        <Field id="quote" label="Quote" hint="Up to 600 characters.">
          <Textarea id="quote" name="quote" required minLength={10} maxLength={600} defaultValue={item?.quote} aria-describedby="quote-hint" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="authorName" label="Name">
            <Input id="authorName" name="authorName" required minLength={2} maxLength={80} defaultValue={item?.authorName} />
          </Field>
          <Field id="authorRole" label="Who they are (optional)" hint="e.g. Repair shop owner">
            <Input id="authorRole" name="authorRole" maxLength={80} defaultValue={item?.authorRole ?? ""} aria-describedby="authorRole-hint" />
          </Field>
          <Field id="city" label="City (optional)">
            <Input id="city" name="city" maxLength={60} defaultValue={item?.city ?? ""} />
          </Field>
          <Field id="rating" label="Stars (optional)">
            <Select id="rating" name="rating" defaultValue={item?.rating ? String(item.rating) : ""}>
              <option value="">No stars</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n === 1 ? "" : "s"}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>
      <Section title="Visibility">
        <Toggle name="isPublished" label="Show on the website" hint="Shown on the home, About and Wholesale pages." defaultChecked={item?.isPublished ?? false} />
      </Section>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">{item ? "Save changes" : "Add testimonial"}</Button>
        <ButtonLink href="/admin/testimonials" variant="ghost" size="lg">Cancel</ButtonLink>
      </div>
    </form>
  );
}
