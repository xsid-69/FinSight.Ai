"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CircleNotch,
  MagicWand,
  ShieldCheck,
} from "@phosphor-icons/react";
import { FormEvent, useMemo, useState } from "react";

import { ProjectionChart } from "@/components/dashboard/projection-chart";
import { defaultScenario, exampleQueries, financialProfile } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/format";
import { generateCashProjection } from "@/lib/math-engine";
import { ScenarioConfigSchema } from "@/lib/schemas";
import type { ScenarioConfig } from "@/types/financial";

const readError = (value: unknown) => {
  if (typeof value === "object" && value !== null && "error" in value) {
    const error = (value as { error: unknown }).error;
    if (typeof error === "string") return error;
  }
  return "We could not understand that plan. Try a shorter question.";
};

export function WhatIfSimulator() {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState<string>(exampleQueries[0]);
  const [scenario, setScenario] = useState<ScenarioConfig>(defaultScenario);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseline = useMemo(
    () => generateCashProjection(financialProfile, {
      ...scenario,
      oneTimeCosts: [],
      monthlyIncomeDelta: 0,
      monthlyRecurringExpenseDelta: 0,
      monthlyVariableExpenseDelta: 0,
    }),
    [scenario],
  );

  const simulated = useMemo(
    () => generateCashProjection(financialProfile, scenario),
    [scenario],
  );

  const submitScenario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(readError(payload));
      if (typeof payload !== "object" || payload === null || !("scenario" in payload)) {
        throw new Error("The scenario response was incomplete.");
      }
      const parsed = ScenarioConfigSchema.safeParse(
        (payload as { scenario: unknown }).scenario,
      );
      if (!parsed.success) throw new Error("That plan was not safe to calculate.");
      setScenario(parsed.data);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : readError(caught));
    } finally {
      setIsLoading(false);
    }
  };

  const baselineEnd = baseline.at(-1)?.endingBalance ?? 0;
  const simulatedEnd = simulated.at(-1)?.endingBalance ?? 0;
  const impact = simulatedEnd - baselineEnd;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      id="simulator"
      aria-labelledby="simulator-title"
      className="scroll-mt-24 overflow-hidden rounded-[26px] bg-surface shadow-soft"
    >
      <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
        <div className="p-5 sm:p-7 lg:border-r lg:border-line">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[15px] bg-accent-soft text-accent"><MagicWand aria-hidden="true" size={22} weight="fill" /></span>
            <div><p className="text-xs font-bold text-accent">PLAN AHEAD</p><p className="text-sm font-semibold text-muted">Ask in your own words</p></div>
          </div>
          <h2 id="simulator-title" className="mt-5 text-balance text-2xl font-bold tracking-[-0.045em] sm:text-3xl">What would this decision change?</h2>
          <p className="mt-2 max-w-lg text-pretty text-sm leading-6 text-muted">Describe one purchase or income change. Your forecast stays deterministic.</p>

          <form onSubmit={submitScenario} className="mt-6">
            <label htmlFor="scenario-query" className="text-sm font-bold">Your plan</label>
            <div className="mt-2 rounded-[18px] bg-canvas p-1.5 ring-1 ring-line">
              <textarea
                id="scenario-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                rows={4}
                required
                maxLength={1_000}
                className="w-full resize-none rounded-[14px] bg-surface px-4 py-3 text-base leading-6 text-ink outline-none placeholder:text-muted/80 focus:ring-2 focus:ring-accent"
                placeholder="What if I buy a 1.5 lakh laptop next month?"
                aria-describedby="scenario-help"
              />
            </div>
            <p id="scenario-help" className="mt-2 text-xs leading-5 text-muted">Try one purchase, salary change, or monthly expense.</p>

            <button
              type="submit"
              disabled={isLoading || query.trim().length === 0}
              className="group mt-4 flex min-h-12 w-full cursor-pointer items-center justify-between rounded-[15px] bg-ink py-1.5 pl-4 pr-1.5 text-sm font-bold text-canvas transition duration-300 ease-app active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:min-w-44"
            >
              <span>{isLoading ? "Building your plan" : "See the impact"}</span>
              <span className="grid size-9 place-items-center rounded-[12px] bg-canvas/12 transition duration-300 ease-app group-hover:translate-x-0.5">
                {isLoading ? <CircleNotch aria-hidden="true" className="animate-spin" size={18} weight="bold" /> : <ArrowRight aria-hidden="true" size={18} weight="bold" />}
              </span>
            </button>
          </form>

          <div className="mt-5 flex snap-x gap-2 overflow-x-auto pb-1" aria-label="Example questions">
            {exampleQueries.slice(1).map((example) => (
              <button key={example} type="button" onClick={() => setQuery(example)} className="min-h-11 min-w-[210px] snap-start rounded-[14px] bg-canvas px-3 py-2 text-left text-xs font-semibold leading-5 text-muted transition duration-300 ease-app hover:text-ink active:scale-[0.98]">
                {example}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {error ? (
              <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-4 rounded-[14px] bg-danger-soft p-3 text-sm font-medium leading-6 text-danger">{error}</motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="min-w-0 bg-canvas/70 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div><p className="font-bold">{scenario.name}</p><p className="mt-1 text-xs font-semibold text-muted">Next {scenario.durationMonths} months</p></div>
            <span className="flex items-center gap-1.5 rounded-xl bg-positive-soft px-2.5 py-2 text-[11px] font-bold text-positive"><ShieldCheck aria-hidden="true" size={15} weight="fill" /> Verified math</span>
          </div>

          <div className="mt-5 rounded-[20px] bg-surface p-2 sm:p-4"><ProjectionChart baseline={baseline} comparison={simulated} height={300} /></div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[15px] bg-surface p-3"><p className="text-[10px] font-bold text-muted">CURRENT PATH</p><p className="mt-1.5 truncate font-mono text-sm font-semibold sm:text-base">{formatCurrency(baselineEnd)}</p></div>
            <div className="rounded-[15px] bg-surface p-3"><p className="text-[10px] font-bold text-muted">YOUR PLAN</p><p className="mt-1.5 truncate font-mono text-sm font-semibold sm:text-base">{formatCurrency(simulatedEnd)}</p></div>
            <div className="rounded-[15px] bg-surface p-3"><p className="text-[10px] font-bold text-muted">DIFFERENCE</p><p className={`mt-1.5 truncate font-mono text-sm font-semibold sm:text-base ${impact < 0 ? "text-danger" : "text-positive"}`}>{formatCurrency(impact)}</p></div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
