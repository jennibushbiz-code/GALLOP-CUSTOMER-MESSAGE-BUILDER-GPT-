import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { GALLOP_PROFILE_INSTRUCTIONS } from "../../../lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type Source = { title?: string; url: string };

function collectSources(value: unknown, found = new Map<string, Source>()) {
  if (!value || typeof value !== "object") return found;

  if (Array.isArray(value)) {
    for (const item of value) collectSources(item, found);
    return found;
  }

  const obj = value as Record<string, unknown>;
  const url = typeof obj.url === "string" ? obj.url : undefined;
  const title = typeof obj.title === "string" ? obj.title : undefined;

  if (url && /^https?:\/\//i.test(url) && !found.has(url)) {
    found.set(url, { url, title });
  }

  for (const child of Object.values(obj)) collectSources(child, found);
  return found;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const offer = String(body?.offer || "").trim();
    const market = String(body?.market || "").trim();
    const context = String(body?.context || "").trim();

    if (!offer || !market) {
      return NextResponse.json(
        { error: "Please complete the first two fields." },
        { status: 400 }
      );
    }

    if (offer.length > 2500 || market.length > 2500 || context.length > 6000) {
      return NextResponse.json(
        { error: "That input is too long. Please shorten it and try again." },
        { status: 400 }
      );
    }

    const userInput = `
BUSINESS FACTS SUPPLIED BY THE MEMBER

WHAT THEY SELL:
${offer}

WHERE / HOW CUSTOMERS CAN BUY OR USE IT:
${market}

EXTRA CONTEXT SUPPLIED BY THE MEMBER:
${context || "None supplied."}

TASK

Research the real market now using web search. Follow the evidence rules exactly.
Build the complete GALLOP Customer & Message Profile and the HANDOFF TO 30-DAY MARKETING PLANNER.

Do not ask the member another question before producing the profile unless proceeding would create a materially misleading or unsafe strategy. If an important business-specific fact is unknown, keep it unknown and show what it prevents you from concluding.
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
      instructions: GALLOP_PROFILE_INSTRUCTIONS,
      input: userInput,
      reasoning: { effort: "medium" },
      tools: [
        {
          type: "web_search",
          search_context_size: "low",
          user_location: {
            type: "approximate",
            country: "GB",
            timezone: "Europe/London"
          }
        }
      ],
      tool_choice: "required",
      max_tool_calls: 4,
      max_output_tokens: 7000,
      include: ["web_search_call.action.sources"],
      metadata: {
        app: "gallop-customer-message-builder"
      }
    });

    const text = response.output_text?.trim();
    if (!text) {
      return NextResponse.json(
        { error: "The model returned no profile. Please try again." },
        { status: 502 }
      );
    }

    const sourceMap = collectSources(response.output);
    const sources = Array.from(sourceMap.values()).slice(0, 16);

    return NextResponse.json({
      text,
      sources,
      requestId: response.id
    });
  } catch (error: unknown) {
    console.error("Profile generation failed:", error);

    const message =
      error instanceof Error ? error.message : "Profile generation failed.";

    if (/rate|quota|429/i.test(message)) {
      return NextResponse.json(
        { error: "The AI service is temporarily at its usage limit. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "I couldn't build the profile this time. Please try again in a moment." },
      { status: 500 }
    );
  }
}
