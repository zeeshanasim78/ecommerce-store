import { Section, Textarea, Toggle } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import type { heroSlides } from "@/db/schema/catalog";
import { asc, isNull } from "drizzle-orm";
import { HERO_THEME_STYLES, PHONE_LAYOUT_STYLES } from "@/components/store/hero-themes";
import { HERO_THEMES, PHONE_LAYOUTS } from "@/db/schema/catalog";
import { saveSlide } from "./actions";

type Slide = typeof heroSlides.$inferSelect;

/** Shared form for adding and editing a hero slide. Plain HTML form → Server Action (works without JS). */
export function SlideForm({ slide }: { slide?: Slide }) {
  const productOptions = db
    .select({ id: products.id, brand: products.brand, model: products.model, grade: products.qualityGrade })
    .from(products)
    .where(isNull(products.archivedAt))
    .orderBy(asc(products.brand), asc(products.model))
    .all();

  return (
    <form action={saveSlide} className="flex flex-col gap-6">
      {slide ? <input type="hidden" name="id" value={slide.id} /> : null}

      <Section title="Text" description="Left side of the slide.">
        <Field id="heading" label="Heading">
          <Input id="heading" name="heading" required minLength={3} maxLength={90} defaultValue={slide?.heading} />
        </Field>
        <Field id="subheading" label="Subheading (optional)">
          <Input id="subheading" name="subheading" maxLength={140} defaultValue={slide?.subheading ?? ""} />
        </Field>
        <Field id="bodyMd" label="Description (optional)" hint="Supports **bold**, *italics*, [links](/store) and lists starting with “- ”. Up to 800 characters.">
          <Textarea id="bodyMd" name="bodyMd" maxLength={800} defaultValue={slide?.bodyMd ?? ""} aria-describedby="bodyMd-hint" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="ctaLabel" label="Button text">
            <Input id="ctaLabel" name="ctaLabel" required maxLength={30} defaultValue={slide?.ctaLabel ?? "View screen"} />
          </Field>
          <Field id="ctaHref" label="Button link" hint="A page on this site such as /store, or an https:// link.">
            <Input id="ctaHref" name="ctaHref" required pattern="(/[^\/].*|/|https:\/\/.+)" defaultValue={slide?.ctaHref ?? "/store"} aria-describedby="ctaHref-hint" />
          </Field>
        </div>
      </Section>

      <Section title="Visual" description="Right side of the slide.">
        <Field id="productId" label="Product shown as the 3D phone" hint="The phone is drawn in this model’s shape (camera cut-out, rear cameras, colour), with its name and grade on the screen.">
          <Select id="productId" name="productId" defaultValue={slide?.productId ?? ""} aria-describedby="productId-hint">
            <option value="">No product (generic Caidea screen)</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.brand} {p.model} — {p.grade}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="visualType" label="Visual type">
          <Select id="visualType" name="visualType" defaultValue={slide?.visualType ?? "PHONE_3D"}>
            <option value="PHONE_3D">Rotating 3D phone screen</option>
            <option value="IMAGE">Image</option>
          </Select>
        </Field>
        <Field id="visualFile" label="Upload an image (switches the slide to Image)" hint="JPG, PNG, WebP or AVIF, up to 5 MB. Converted to WebP automatically.">
          <input
            id="visualFile"
            name="visualFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="rounded-full border border-midnight/18 bg-white px-4 py-2 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-midnight file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-canvas"
          />
        </Field>
        <Field id="visualUrl" label="…or image link" hint="An uploaded image path (/uploads/…) or an https:// image URL.">
          <Input id="visualUrl" name="visualUrl" defaultValue={slide?.visualUrl ?? ""} />
        </Field>
      </Section>

      <Section title="Look" description="Each slide can have its own colours and phone position, so the carousel feels varied.">
        <fieldset>
          <legend className="pl-1 text-sm font-semibold">Colour theme</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-5">
            {HERO_THEMES.map((t) => (
              <label key={t} className="cursor-pointer">
                <input type="radio" name="theme" value={t} defaultChecked={(slide?.theme ?? "MIDNIGHT") === t} className="peer sr-only" />
                <span
                  className="block h-16 rounded-bezel-sm ring-2 ring-transparent transition-shadow peer-checked:ring-midnight peer-checked:ring-offset-2 peer-focus-visible:outline-2 peer-focus-visible:outline-terracotta"
                  style={{ background: HERO_THEME_STYLES[t].background }}
                />
                <span className="mt-1.5 block text-sm font-medium">{HERO_THEME_STYLES[t].label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field id="phoneLayout" label="Phone size and position">
          <Select id="phoneLayout" name="phoneLayout" defaultValue={slide?.phoneLayout ?? "RIGHT"}>
            {PHONE_LAYOUTS.map((l) => (
              <option key={l} value={l}>
                {PHONE_LAYOUT_STYLES[l].label}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Visibility">
        <Toggle name="isActive" label="Show this slide on the home page" hint="Up to 5 slides can be live at once." defaultChecked={slide?.isActive ?? true} />
      </Section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">
          {slide ? "Save changes" : "Add slide"}
        </Button>
        <ButtonLink href="/admin/hero" variant="ghost" size="lg">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
