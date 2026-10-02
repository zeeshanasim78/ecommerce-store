"use client";

import { useRef, type ReactNode } from "react";
import { Button } from "./button";

/**
 * Modal built on the native <dialog> element: focus trapping, Esc to close and
 * the backdrop come from the browser, so no extra JavaScript library is needed.
 */
export function Dialog({
  triggerLabel,
  title,
  children,
  confirmLabel,
  onConfirm,
}: {
  triggerLabel: string;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button variant="outline" onClick={() => ref.current?.showModal()}>
        {triggerLabel}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby="dialog-title"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-bezel-lg bg-white p-0 text-midnight backdrop:bg-midnight/55"
      >
        <div className="flex flex-col gap-5 p-7">
          <h2 id="dialog-title" className="text-xl font-bold">
            {title}
          </h2>
          <div className="text-midnight/80">{children}</div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            {confirmLabel ? (
              <Button
                variant="urgent"
                onClick={() => {
                  onConfirm?.();
                  ref.current?.close();
                }}
              >
                {confirmLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
