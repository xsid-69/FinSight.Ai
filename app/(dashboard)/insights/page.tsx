import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { IntelligenceFeed } from "@/components/dashboard/intelligence-feed";
import { PageHeader } from "@/components/dashboard/page-header";
import { SpendingBreakdown } from "@/components/dashboard/spending-breakdown";

export const metadata: Metadata = {
  title: "Insights | FinSight.ai",
  description: "Deterministic spending signals and category analysis.",
};

export default function InsightsPage() {
  return (
    <>
      <PageHeader
        label="Insights"
        title="Know what changed."
        description="Signals are calculated from your actual history, then explained in plain language."
        action={<label className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-surface px-3.5 text-sm font-bold shadow-soft"><SlidersHorizontal aria-hidden="true" size={18} weight="bold" /><span className="sr-only">Analysis period</span><select defaultValue="month" className="cursor-pointer bg-transparent pr-1 outline-none"><option value="month">This month</option><option value="quarter">This quarter</option><option value="year">This year</option></select></label>}
      />
      <div className="space-y-6 sm:space-y-8">
        <IntelligenceFeed />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <SpendingBreakdown />
          <section aria-labelledby="signal-rules-title" className="rounded-[24px] bg-ink p-5 text-canvas shadow-soft sm:p-6">
            <p className="text-sm font-bold text-accent-soft">Signal rules</p>
            <h2 id="signal-rules-title" className="mt-1 text-xl font-bold tracking-[-0.035em]">How alerts are triggered</h2>
            <div className="mt-6 space-y-3">
              {["20% above category baseline", "New merchant or unusual amount", "Runway below three months"].map((rule) => (
                <div key={rule} className="flex items-center gap-3 rounded-[15px] bg-canvas/8 px-3.5 py-3 text-sm font-semibold"><span className="size-2 rounded-full bg-accent" />{rule}</div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
