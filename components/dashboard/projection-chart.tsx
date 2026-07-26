"use client";

import { useReducedMotion } from "framer-motion";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency, formatCurrency, formatMonth } from "@/lib/format";
import type { ProjectedMonth } from "@/types/financial";

interface ProjectionChartProps {
  baseline: ProjectedMonth[];
  comparison?: ProjectedMonth[];
  comparisonLabel?: string;
  height?: number;
}

export function ProjectionChart({
  baseline,
  comparison,
  comparisonLabel = "Your plan",
  height = 300,
}: ProjectionChartProps) {
  const reduceMotion = useReducedMotion();
  const data = baseline.map((month, index) => ({
    month: month.month,
    baseline: month.endingBalance,
    comparison: comparison?.[index]?.endingBalance,
  }));

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Cash balance projection over ${baseline.length} months${comparison ? ", comparing current path and your plan" : ""}.`}
    >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart accessibilityLayer data={data} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 7" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            axisLine={false}
            tickLine={false}
            minTickGap={34}
            tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 600 }}
          />
          <YAxis
            tickFormatter={formatCompactCurrency}
            axisLine={false}
            tickLine={false}
            width={60}
            tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => formatMonth(String(label))}
            cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--surface)",
              border: "none",
              borderRadius: 14,
              boxShadow: "var(--shadow-soft)",
              color: "var(--ink)",
              fontSize: 12,
            }}
          />
          {comparison ? (
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ color: "var(--muted)", fontSize: 11, fontWeight: 600, paddingBottom: 14 }}
            />
          ) : null}
          <Line
            type="monotone"
            dataKey="baseline"
            name="Current path"
            stroke="var(--chart-secondary)"
            strokeWidth={2.25}
            dot={false}
            activeDot={{ r: 4, fill: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={!reduceMotion}
            animationDuration={700}
          />
          {comparison ? (
            <Line
              type="monotone"
              dataKey="comparison"
              name={comparisonLabel}
              stroke="var(--accent)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: "var(--surface)", strokeWidth: 2 }}
              isAnimationActive={!reduceMotion}
              animationDuration={850}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
