import { Info } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { FinancialTimeMachine } from "@/components/dashboard/time-machine";
import { financialProfile } from "@/lib/dashboard-data";

export const metadata: Metadata = {
  title: "Forecast | FinSight.ai",
  description: "Deterministic 1, 3, and 5-year cash-flow projections.",
};

const assumptions = [
  ["Income growth", `${(financialProfile.annualIncomeGrowthRate * 100).toFixed(1)}% yearly`],
  ["Expense inflation", `${(financialProfile.annualExpenseInflationRate * 100).toFixed(1)}% yearly`],
  ["Starting month", financialProfile.startMonth],
] as const;

export default function ForecastPage() {
  return (
    <>
      <PageHeader
        label="Forecast"
        title="See the path ahead."
        description="Move between time horizons and inspect the assumptions behind every projected month."
      />
      <div className="space-y-6 sm:space-y-8">
        <FinancialTimeMachine />
        <details className="group rounded-[24px] bg-surface p-5 shadow-soft sm:p-6">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold"><span className="flex items-center gap-2"><Info aria-hidden="true" className="text-accent" size={20} weight="fill" />Projection assumptions</span><span className="text-xl text-muted transition duration-300 ease-app group-open:rotate-45">+</span></summary>
          <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
            {assumptions.map(([label, value]) => <div key={label} className="rounded-[15px] bg-canvas p-3.5"><p className="text-xs font-bold text-muted">{label}</p><p className="mt-1 font-mono text-sm font-semibold">{value}</p></div>)}
          </div>
        </details>
      </div>
    </>
  );
}
