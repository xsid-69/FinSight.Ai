import { z } from "zod";

import { parseUserScenario } from "@/lib/ai-engine";

const RequestSchema = z.object({
  query: z.string().trim().min(1).max(1_000),
}).strict();

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const payload = RequestSchema.safeParse(body);
    if (!payload.success) {
      return Response.json(
        { error: "Enter a financial question under 1,000 characters." },
        { status: 400 },
      );
    }

    const scenario = await parseUserScenario(payload.data.query);
    return Response.json({ scenario });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Scenario parsing failed.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
