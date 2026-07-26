import {
  ArrowUpRight,
  CheckCircle,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";

import { proactiveFacts } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/format";

export function IntelligenceFeed() {
  return (
    <section id="intelligence" aria-labelledby="intelligence-title" className="app-enter scroll-mt-24 [animation-delay:160ms]">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent">Spending signals</p>
          <h2 id="intelligence-title" className="mt-1 text-2xl font-bold tracking-[-0.045em]">What changed this month</h2>
        </div>
        <span className="shrink-0 rounded-lg bg-accent-soft px-2.5 py-1.5 text-xs font-bold text-accent">{proactiveFacts.length} updates</span>
      </div>

      {proactiveFacts.length === 0 ? (
        <div className="flex min-h-36 items-center gap-3 rounded-[22px] bg-surface p-5 shadow-soft">
          <span className="grid size-11 place-items-center rounded-[15px] bg-positive-soft text-positive"><CheckCircle aria-hidden="true" size={23} weight="fill" /></span>
          <div><p className="font-bold">Everything looks steady</p><p className="mt-1 text-sm text-muted">No spending category crossed your alert threshold.</p></div>
        </div>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
          {proactiveFacts.map((fact) => (
            <article key={fact.id} className="min-w-[86vw] snap-center rounded-[22px] bg-surface p-5 shadow-soft sm:min-w-0">
              <div className="flex items-start justify-between gap-4">
                <span className={`grid size-11 place-items-center rounded-[15px] ${fact.severity === "critical" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
                  {fact.severity === "critical" ? <WarningCircle aria-hidden="true" size={23} weight="fill" /> : <Sparkle aria-hidden="true" size={22} weight="fill" />}
                </span>
                <ArrowUpRight aria-hidden="true" className="text-muted" size={18} weight="bold" />
              </div>
              <div className="mt-6">
                <p className="font-mono text-[1.7rem] font-semibold tracking-[-0.055em]">{fact.displayValue}</p>
                <h3 className="mt-1.5 font-bold tracking-[-0.02em]">{fact.category} moved outside its usual range</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  You have spent {formatCurrency(fact.currentValue)} compared with your usual {formatCurrency(fact.baselineValue)}.
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-[11px] font-semibold text-muted">
                <span>{fact.period}</span>
                <span>Calculated from history</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
