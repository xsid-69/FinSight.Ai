"use client";

import { ArrowCounterClockwise, WarningCircle } from "@phosphor-icons/react";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-canvas px-4 text-ink">
      <section className="w-full max-w-md rounded-[26px] bg-surface p-6 shadow-soft sm:p-8">
        <span className="grid size-12 place-items-center rounded-[16px] bg-danger-soft text-danger"><WarningCircle aria-hidden="true" size={25} weight="fill" /></span>
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.045em]">We could not open your dashboard</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Your data is safe. Retry now, then check your configured services if this continues.</p>
        <button type="button" onClick={reset} className="mt-6 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[15px] bg-ink px-4 text-sm font-bold text-canvas transition duration-300 ease-app active:scale-[0.98]">
          <ArrowCounterClockwise aria-hidden="true" size={18} weight="bold" /> Try again
        </button>
      </section>
    </main>
  );
}
