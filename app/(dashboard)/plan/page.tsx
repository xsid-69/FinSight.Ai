import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { WhatIfSimulator } from "@/components/dashboard/simulator";

export const metadata: Metadata = {
  title: "Plan | FinSight.ai",
  description: "Test financial decisions with deterministic cash-flow projections.",
};

export default function PlanPage() {
  return (
    <>
      <PageHeader
        label="What-if planner"
        title="Try the decision before you make it."
        description="Ask naturally. FinSight structures the scenario, while the math engine calculates every outcome."
      />
      <div className="space-y-6 sm:space-y-8">
        <WhatIfSimulator />
        <section aria-labelledby="planner-guide-title" className="rounded-[24px] bg-surface p-5 shadow-soft sm:p-6">
          <h2 id="planner-guide-title" className="text-xl font-bold tracking-[-0.035em]">Plans work best when they are specific</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Name one purchase or change", "Include the amount and timing", "Choose a 1, 3, or 5-year view"].map((tip) => (
              <div key={tip} className="flex gap-3 rounded-[16px] bg-canvas p-3.5 text-sm font-semibold leading-6"><CheckCircle aria-hidden="true" className="mt-0.5 shrink-0 text-positive" size={19} weight="fill" />{tip}</div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
