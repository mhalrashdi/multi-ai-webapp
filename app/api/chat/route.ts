import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Run GPT and Gemini in parallel
    const [gpt, gemini] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
      }),
      genAI
        .getGenerativeModel({ model: "gemini-1.5-pro" })
        .generateContent(message),
    ]);

    const gptText = gpt.choices[0].message.content;

    const geminiText =
      gemini.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Judge with GPT
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

Answer 2: ${geminiText}`,
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
