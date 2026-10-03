"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { lookupOrder, type LookupState } from "./actions";

/** Order tracking (spec §2 /order/:code): order number + checkout phone opens the full order (v1.11 §23). */
export function TrackOrder({ initialCode }: { initialCode?: string }) {
  const router = useRouter();
  const [state, lookup, looking] = useActionState<LookupState, FormData>(lookupOrder, {});

  useEffect(() => {
    if (!state.opened) return;
    router.replace(`/order/${state.opened}`);
    router.refresh();
  }, [state.opened, router]);

  if (state.opened) {
    return (
      <p role="status" className="mt-8 rounded-bezel bg-midnight p-6 font-semibold text-canvas">
        Opening order {state.opened}…
      </p>
    );
  }

  return (
    <form action={lookup} className="mt-8 grid max-w-xl gap-5 rounded-bezel bg-white p-6 ring-1 ring-midnight/8 sm:p-8">
      <Field id="code" label="Order number">
        <Input id="code" name="code" required defaultValue={initialCode} placeholder="CA-ORD-261003-0001" className="tabular uppercase" autoComplete="off" />
      </Field>
      <Field id="phone" label="Phone number used for the order">
        <Input id="phone" name="phone" type="tel" required inputMode="tel" placeholder="0300 1234567" autoComplete="tel" />
      </Field>
      {state.error ? (
        <p role="alert" className="font-medium text-terracotta">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={looking}>
          {looking ? "Looking…" : "Show my order"}
        </Button>
      </div>
    </form>
  );
}
