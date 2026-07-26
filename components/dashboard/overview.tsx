import {
  ArrowUpRight,
  CalendarBlank,
  CreditCard,
  Receipt,
  ShieldCheck,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

import { financialProfile, recurringExpenses } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/format";
import { generateCashProjection } from "@/lib/math-engine";

export function FinancialOverview() {
  const [currentMonth] = generateCashProjection(financialProfile);
  const monthlyOutflow =
    financialProfile.monthlyRecurringExpenses + financialProfile.monthlyVariableExpenses;
  const monthlySurplus = financialProfile.monthlyIncome - monthlyOutflow;

  return (
    <section id="overview" aria-labelledby="overview-title" className="app-enter scroll-mt-24 [animation-delay:80ms]">
      <h2 id="overview-title" className="sr-only">Financial overview</h2>
      <div className="grid gap-4 lg:grid-cols-[1.12fr_.88fr]">
        <article className="relative isolate min-h-[260px] overflow-hidden rounded-[26px] bg-balance p-5 text-balance-ink shadow-brand sm:p-7">
          <div aria-hidden="true" className="balance-orbit" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-balance-ink/65">Total available</p>
                <p className="mt-2 font-mono text-[2.35rem] font-semibold leading-none tracking-[-0.07em] sm:text-[3.2rem]">{formatCurrency(financialProfile.initialBalance)}</p>
              </div>
              <span className="grid size-11 place-items-center rounded-[15px] bg-balance-ink/10"><Wallet aria-hidden="true" size={22} weight="fill" /></span>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-3">
              <div className="rounded-[17px] bg-balance-ink/10 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-balance-ink/65"><ArrowUpRight aria-hidden="true" size={14} weight="bold" /> Safe to save</div>
                <p className="mt-2 font-mono text-lg font-semibold">{formatCurrency(monthlySurplus)}</p>
              </div>
              <div className="rounded-[17px] bg-balance-ink/10 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-balance-ink/65"><ShieldCheck aria-hidden="true" size={14} weight="fill" /> Runway</div>
                <p className="mt-2 font-mono text-lg font-semibold">{currentMonth.emergencyRunwayMonths} months</p>
              </div>
            </div>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <article className="rounded-[22px] bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-[14px] bg-positive-soft text-positive"><ArrowUpRight aria-hidden="true" size={19} weight="bold" /></span>
              <span className="text-xs font-semibold text-muted">Monthly</span>
            </div>
            <p className="mt-7 text-sm font-semibold text-muted">Income</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-[-0.055em]">{formatCurrency(financialProfile.monthlyIncome)}</p>
          </article>

          <article className="rounded-[22px] bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-[14px] bg-warning-soft text-warning"><Receipt aria-hidden="true" size={19} weight="fill" /></span>
              <span className="text-xs font-semibold text-muted">Monthly</span>
            </div>
            <p className="mt-7 text-sm font-semibold text-muted">Expenses</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-[-0.055em]">{formatCurrency(monthlyOutflow)}</p>
          </article>

          <article className="rounded-[22px] bg-surface p-5 shadow-soft sm:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-10 place-items-center rounded-[14px] bg-accent-soft text-accent"><CreditCard aria-hidden="true" size={20} weight="fill" /></span>
                <div><p className="font-bold">Recurring payments</p><p className="text-xs text-muted">{formatCurrency(financialProfile.monthlyRecurringExpenses)} this month</p></div>
              </div>
              <CalendarBlank aria-hidden="true" className="text-muted" size={19} weight="bold" />
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              {recurringExpenses.map((expense) => (
                <div key={expense.label} className="min-w-0">
                  <p className="truncate text-xs font-semibold text-muted">{expense.label}</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold">{formatCurrency(expense.amount)}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
