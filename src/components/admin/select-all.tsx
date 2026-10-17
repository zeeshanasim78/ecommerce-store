"use client";

/** "Tick all" for a list of checkboxes named `name` inside the same form. */
export function SelectAll({ name, label = "Tick all" }: { name: string; label?: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      title={label}
      className="size-5 accent-midnight"
      onChange={(e) => {
        const form = e.currentTarget.form;
        if (!form) return;
        for (const box of form.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name="${name}"]`)) box.checked = e.currentTarget.checked;
      }}
    />
  );
}
