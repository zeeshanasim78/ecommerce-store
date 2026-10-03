"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { addTransactionId, type TidState } from "@/app/(storefront)/order/actions";

/** Optional: the customer types the transaction ID instead of (or as well as) sending a screenshot. */
export function TidForm({ code, bank }: { code: string; bank: boolean }) {
  const router = useRouter();
  const [state, send, sending] = useActionState<TidState, FormData>(addTransactionId, {});
  useEffect(() => {
    if (state.done) router.refresh();
  }, [state.done, router]);

  if (state.done) {
    return (
      <p role="status" className="rounded-bezel-sm bg-midnight px-5 py-4 font-medium text-canvas">
        Thank you — we’ve got your transaction ID. We’ll check it and email you when the payment is confirmed.
      </p>
    );
  }
  return (
    <form action={send} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="code" value={code} />
      <Field id="tid" label={bank ? "Bank reference number" : "Transaction ID"}>
        <Input id="tid" name="tid" required pattern="[A-Za-z0-9\-]{6,30}" maxLength={30} autoComplete="off" className="tabular uppercase" />
      </Field>
      {!bank ? (
        <Field id="payerPhone" label="Number you paid from (optional)">
          <Input id="payerPhone" name="payerPhone" type="tel" inputMode="tel" placeholder="0300 1234567" />
        </Field>
      ) : null}
      {state.error ? (
        <p role="alert" className="font-medium text-terracotta sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" variant="outline" disabled={sending}>
          {sending ? "Sending…" : "Send transaction ID"}
        </Button>
      </div>
    </form>
  );
}
