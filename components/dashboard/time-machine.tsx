"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarDots, TrendUp } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { ProjectionChart } from "@/components/dashboard/projection-chart";
import { financialProfile } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/format";
import { generateCashProjection } from "@/lib/math-engine";
import type { ProjectionDuration, ScenarioConfig } from "@/types/financial";

const horizons: { label: string; value: ProjectionDuration }[] = [
  { label: "1 year", value: 12 },
  { label: "3 years", value: 36 },
  { label: "5 years", value: 60 },
];

export function FinancialTimeMachine() {
  const reduceMotion = useReducedMotion();
  const [duration, setDuration] = useState<ProjectionDuration>(36);
  const projection = useMemo(() => {
    const baselineScenario: ScenarioConfig = {
      name: "Baseline",
      durationMonths: duration,
      oneTimeCosts: [],
      monthlyIncomeDelta: 0,
      monthlyRecurringExpenseDelta: 0,
      monthlyVariableExpenseDelta: 0,
    };
    return generateCashProjection(financialProfile, baselineScenario);
  }, [duration]);

  const finalMonth = projection.at(-1);
  const gain = (finalMonth?.endingBalance ?? 0) - financialProfile.initialBalance;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      id="forecast"
      aria-labelledby="forecast-title"
      className="scroll-mt-24 rounded-[26px] bg-surface p-5 shadow-soft sm:p-7"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-accent-soft text-accent"><CalendarDots aria-hidden="true" size={22} weight="fill" /></span>
          <div>
            <p className="text-xs font-bold text-accent">LONG-TERM VIEW</p>
            <h2 id="forecast-title" className="mt-1 text-balance text-2xl font-bold tracking-[-0.045em] sm:text-3xl">See where your habits lead</h2>
            <p className="mt-2 max-w-xl text-pretty text-sm leading-6 text-muted">Income growth and expense inflation are applied to every month.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 rounded-[15px] bg-canvas p-1" aria-label="Projection horizon">
          {horizons.map((horizon) => (
            <button
              key={horizon.value}
              type="button"
              aria-pressed={duration === horizon.value}
              onClick={() => setDuration(horizon.value)}
              className={`min-h-11 cursor-pointer whitespace-nowrap rounded-[12px] px-3 text-sm font-bold transition duration-300 ease-app active:scale-[0.98] ${duration === horizon.value ? "bg-ink text-canvas shadow-soft" : "text-muted hover:text-ink"}`}
            >
              {horizon.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_250px] xl:items-stretch">
        <div className="min-w-0 rounded-[20px] bg-canvas/70 p-2 sm:p-4"><ProjectionChart baseline={projection} height={320} /></div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
          <div className="col-span-2 rounded-[18px] bg-balance p-4 text-balance-ink xl:col-span-1">
            <p className="text-xs font-semibold text-balance-ink/65">Projected balance</p>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-[-0.055em]">{formatCurrency(finalMonth?.endingBalance ?? 0)}</p>
          </div>
          <div className="rounded-[18px] bg-canvas p-4">
            <p className="text-[11px] font-bold text-muted">NET CHANGE</p>
            <p className={`mt-2 font-mono text-lg font-semibold ${gain >= 0 ? "text-positive" : "text-danger"}`}>{formatCurrency(gain)}</p>
          </div>
          <div className="rounded-[18px] bg-canvas p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted"><TrendUp aria-hidden="true" size={15} weight="bold" /> SAVINGS RATE</div>
            <p className="mt-2 font-mono text-lg font-semibold">{finalMonth?.savingsRate ?? 0}%</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
