import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const [gpt, claude] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
      }),
      anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [{ role: "user", content: message }],
      }),
    ]);

    const gptText = gpt.choices[0].message.content;

    const claudeText =
      claude.content
        .filter((block) => block.type === "text")
        .map((block: any) => block.text)
        .join("\n") || "";

    const judge = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an AI judge. Choose the best answer and return only that answer.",
        },
        {
          role: "user",
          content: `Question: ${message}

Answer 1: ${gptText}

Answer 2: ${claudeText}`,
        },
      ],
    });

    return NextResponse.json({
      result: judge.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
