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
    const [gptResponse, geminiResponse] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
      }),

      (async () => {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash-latest",
        });

        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
        });

        return (
          result.response.candidates?.[0]?.content?.parts?.[0]?.text || ""
        );
      })(),
    ]);

    const gptText = gptResponse.choices[0].message.content;
    const geminiText = geminiResponse;

    // Judge using GPT
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
      {
        error:
          error?.message ||
          "Something went wrong while generating the response.",
      },
      { status: 500 }
    );
  }
}
