import { ChartDonut } from "@phosphor-icons/react/dist/ssr";

import { categorySpending } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/format";

export function SpendingBreakdown() {
  const maximum = Math.max(...categorySpending.map((item) => item.amount));

  return (
    <section aria-labelledby="breakdown-title" className="rounded-[24px] bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-sm font-bold text-accent">Category view</p><h2 id="breakdown-title" className="mt-1 text-xl font-bold tracking-[-0.035em]">Where money went</h2></div>
        <span className="grid size-10 place-items-center rounded-[14px] bg-accent-soft text-accent"><ChartDonut aria-hidden="true" size={20} weight="fill" /></span>
      </div>
      <div className="mt-6 space-y-5">
        {categorySpending.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="font-bold">{item.label}</span><span className="font-mono font-semibold text-muted">{formatCurrency(item.amount)}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-canvas" role="img" aria-label={`${item.label}: ${formatCurrency(item.amount)}`}>
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(8, (item.amount / maximum) * 100)}%`, opacity: item.opacity }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
