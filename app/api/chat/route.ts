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
  const { message } = await req.json();

  const gpt = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: message }],
  });

  const claude = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 500,
    messages: [{ role: "user", content: message }],
  });

  const gptText = gpt.choices[0].message.content;
  const claudeText = claude.content[0].text;

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
}
