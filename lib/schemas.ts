import { z } from "zod";

export const ProjectionDurationSchema = z.union([
  z.literal(12),
  z.literal(36),
  z.literal(60),
]);

export const OneTimeCostSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(120),
    amount: z.number().finite().nonnegative(),
    monthOffset: z.number().int().min(0).max(59),
  })
  .strict();

export const ScenarioConfigSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    durationMonths: ProjectionDurationSchema,
    oneTimeCosts: z.array(OneTimeCostSchema).max(12),
    monthlyIncomeDelta: z.number().finite().min(-10_000_000).max(10_000_000),
    monthlyRecurringExpenseDelta: z.number().finite().min(-10_000_000).max(10_000_000),
    monthlyVariableExpenseDelta: z.number().finite().min(-10_000_000).max(10_000_000),
  })
  .strict();

export const FinancialFactSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    kind: z.enum(["spending_velocity", "anomaly", "runway", "savings_rate"]),
    severity: z.enum(["info", "warning", "critical"]),
    title: z.string().trim().min(1).max(140),
    category: z.string().trim().min(1).max(80).optional(),
    currentValue: z.number().finite(),
    baselineValue: z.number().finite(),
    variancePercentage: z.number().finite(),
    displayValue: z.string().trim().min(1).max(80),
    period: z.string().trim().min(1).max(80),
  })
  .strict();
