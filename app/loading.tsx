export default function Loading() {
  return (
    <main className="min-h-[100dvh] bg-canvas px-4 py-5 text-ink md:pl-[124px] md:pr-8 md:pt-9">
      <div className="mx-auto max-w-[1156px] animate-pulse" aria-label="Loading financial dashboard">
        <div className="flex items-center justify-between md:hidden">
          <div className="size-10 rounded-[14px] bg-surface" />
          <div className="h-10 w-28 rounded-[14px] bg-surface" />
        </div>
        <div className="mt-6 h-8 w-52 rounded-xl bg-surface sm:w-72" />
        <div className="mt-3 h-4 w-64 rounded-lg bg-surface sm:w-96" />
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.12fr_.88fr]">
          <div className="h-[260px] rounded-[26px] bg-surface" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-36 rounded-[22px] bg-surface" />
            <div className="h-36 rounded-[22px] bg-surface" />
            <div className="col-span-2 h-32 rounded-[22px] bg-surface" />
          </div>
        </div>
      </div>
    </main>
  );
}
