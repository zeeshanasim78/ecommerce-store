import { Section, Textarea, Toggle } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { SERVICE_ICONS, type Service } from "@/server/content/services";
import { saveServiceAction } from "./actions";

const ICON_LABEL: Record<(typeof SERVICE_ICONS)[number], string> = {
  wholesale: "Shop front (wholesale)",
  fitting: "Tools (fitting)",
  warranty: "Shield (warranty)",
  delivery: "Truck (delivery)",
  support: "Headset (support)",
  quality: "Star (quality)",
};

export function ServiceForm({ service }: { service?: Service }) {
  return (
    <form action={saveServiceAction} className="flex flex-col gap-6">
      {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <Section title="The service">
        <Field id="title" label="Title">
          <Input id="title" name="title" required minLength={3} maxLength={90} defaultValue={service?.title} />
        </Field>
        <Field id="summary" label="Short summary" hint="One or two sentences, shown under the title. Up to 240 characters.">
          <Textarea id="summary" name="summary" required minLength={10} maxLength={240} className="min-h-20" defaultValue={service?.summary} aria-describedby="summary-hint" />
        </Field>
        <Field id="bodyMd" label="More details (optional)" hint="Markdown: **bold**, lists starting with “- ”, [links](/contact). Up to 6,000 characters.">
          <Textarea id="bodyMd" name="bodyMd" maxLength={6000} className="min-h-40 font-mono" defaultValue={service?.bodyMd ?? ""} aria-describedby="bodyMd-hint" />
        </Field>
        <Field id="icon" label="Icon">
          <Select id="icon" name="icon" defaultValue={service?.icon ?? "quality"}>
            {SERVICE_ICONS.map((i) => (
              <option key={i} value={i}>{ICON_LABEL[i]}</option>
            ))}
          </Select>
        </Field>
      </Section>
      <Section title="Visibility">
        <Toggle name="isActive" label="Show on the Wholesale & Enterprise page" defaultChecked={service?.isActive ?? true} />
      </Section>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">{service ? "Save changes" : "Add service"}</Button>
        <ButtonLink href="/admin/services" variant="ghost" size="lg">Cancel</ButtonLink>
      </div>
    </form>
  );
}
