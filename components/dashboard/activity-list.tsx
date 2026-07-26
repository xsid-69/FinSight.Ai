import { ArrowDownLeft, ArrowUpRight, Receipt } from "@phosphor-icons/react/dist/ssr";

import { recentTransactions } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/format";

export function ActivityList() {
  return (
    <section aria-labelledby="activity-title" className="rounded-[24px] bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-sm font-bold text-accent">Recent activity</p><h2 id="activity-title" className="mt-1 text-xl font-bold tracking-[-0.035em]">Latest transactions</h2></div>
        <span className="grid size-10 place-items-center rounded-[14px] bg-accent-soft text-accent"><Receipt aria-hidden="true" size={20} weight="fill" /></span>
      </div>
      <div className="mt-5 space-y-1">
        {recentTransactions.map((transaction) => {
          const isIncome = transaction.type === "income";
          return (
            <div key={transaction.id} className="flex min-h-16 items-center gap-3 rounded-[16px] px-2 transition duration-300 ease-app hover:bg-canvas">
              <span className={`grid size-10 shrink-0 place-items-center rounded-[14px] ${isIncome ? "bg-positive-soft text-positive" : "bg-canvas text-muted"}`}>
                {isIncome ? <ArrowDownLeft aria-hidden="true" size={18} weight="bold" /> : <ArrowUpRight aria-hidden="true" size={18} weight="bold" />}
              </span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{transaction.description}</p><p className="mt-0.5 text-xs font-semibold text-muted">{transaction.category} · {transaction.date}</p></div>
              <p className={`font-mono text-sm font-semibold ${isIncome ? "text-positive" : "text-ink"}`}>{isIncome ? "+" : "-"}{formatCurrency(transaction.amount)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
