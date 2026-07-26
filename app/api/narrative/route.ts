import { FinancialFactSchema } from "@/lib/schemas";
import { generateFactNarrative } from "@/lib/ai-engine";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const fact = FinancialFactSchema.safeParse(body);
    if (!fact.success) {
      return Response.json(
        { error: "The supplied financial fact is invalid." },
        { status: 400 },
      );
    }

    const insight = await generateFactNarrative(fact.data);
    return Response.json({ insight });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Narrative generation failed.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
