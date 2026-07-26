import "server-only";

import OpenAI from "openai";
import { z } from "zod";

import { FinancialFactSchema, ScenarioConfigSchema } from "@/lib/schemas";
import type { AIInsight, FinancialFact, ScenarioConfig } from "@/types/financial";

const NarrativeResponseSchema = z
  .object({ summary: z.string().trim().min(1).max(360) })
  .strict();

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey });
};

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error("The AI returned invalid JSON.");
  }
};

const numericTokens = (value: string) =>
  value.match(/-?\d[\d,]*(?:\.\d+)?%?/g)?.map((token) =>
    token.replaceAll(",", "").replace("%", ""),
  ) ?? [];

const assertNarrativeGrounding = (narrative: string, fact: FinancialFact) => {
  const allowed = new Set(
    [fact.currentValue, fact.baselineValue, fact.variancePercentage]
      .flatMap((value) => [String(value), String(Math.abs(value))])
      .concat(numericTokens(fact.displayValue)),
  );
  if (numericTokens(narrative).some((token) => !allowed.has(token))) {
    throw new Error("The AI narrative introduced an unverified number.");
  }
};

export async function parseUserScenario(query: string): Promise<ScenarioConfig> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length > 1_000) {
    throw new Error("Scenario query must contain between 1 and 1,000 characters.");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const completion = await getClient().chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You convert a financial what-if question into JSON only.",
          "Do not calculate balances, interest, savings, runway, or projections.",
          "Amounts are numeric INR. Convert Indian lakh/crore notation only as part of parsing.",
          "monthOffset is zero-based: this month is 0 and next month is 1.",
          "Use durationMonths 12, 36, or 60. Default to 36 when absent.",
          "Return exactly: name, durationMonths, oneTimeCosts, monthlyIncomeDelta, monthlyRecurringExpenseDelta, monthlyVariableExpenseDelta.",
          "Each oneTimeCost contains id, label, amount, monthOffset. Use an empty array when absent.",
          "Use 0 for every unspecified delta.",
        ].join(" "),
      },
      { role: "user", content: cleanQuery },
    ],
  });

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error("The AI returned an empty scenario.");

  const result = ScenarioConfigSchema.safeParse(parseJson(content));
  if (!result.success) {
    throw new Error(`The AI scenario failed validation: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export async function generateFactNarrative(
  unvalidatedFact: FinancialFact,
): Promise<AIInsight> {
  const fact = FinancialFactSchema.parse(unvalidatedFact);
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const completion = await getClient().chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "Write a friendly financial explanation in one or two short sentences.",
          "Use only the supplied fact. Do not calculate, infer, recommend, or introduce numbers.",
          "Copy numeric values exactly. Return JSON with one key named summary.",
        ].join(" "),
      },
      { role: "user", content: JSON.stringify(fact) },
    ],
  });

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error("The AI returned an empty narrative.");
  const response = NarrativeResponseSchema.parse(parseJson(content));
  assertNarrativeGrounding(response.summary, fact);

  return {
    id: crypto.randomUUID(),
    factId: fact.id,
    narrative: response.summary,
    generatedAt: new Date().toISOString(),
    model,
  };
}
