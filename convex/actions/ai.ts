"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const analyzeDocument = internalAction({
  args: {
    documentId: v.id("documents"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { documentId, title, content }) => {
    // Truncate very long documents to avoid token limits
    const truncated = content.slice(0, 8000);

    const prompt = `Analyze the following document and respond with a JSON object only. No explanation, no markdown, just the raw JSON.

The JSON must have exactly these fields:
- "summary": a 2-3 sentence plain English summary of the document
- "keywords": an array of 5-8 keywords or short phrases that capture the main topics
- "sentiment": one of exactly these three values: "positive", "neutral", or "negative"

Document title: ${title}

Document content:
${truncated}`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const raw = completion.choices[0]?.message?.content ?? "";

      // Strip markdown code fences if the model includes them despite instructions
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      // Validate the shape before writing to the database
      if (
        typeof parsed.summary !== "string" ||
        !Array.isArray(parsed.keywords) ||
        !["positive", "neutral", "negative"].includes(parsed.sentiment)
      ) {
        throw new Error("Unexpected response shape from model");
      }

      await ctx.runMutation(internal.ai.saveAnalysis, {
        documentId,
        summary: parsed.summary,
        keywords: parsed.keywords.map(String),
        sentiment: parsed.sentiment,
      });
    } catch (err) {
      // Write a failure state so the UI can show an error instead of spinning forever
      await ctx.runMutation(internal.ai.saveAnalysis, {
        documentId,
        summary: "Analysis failed. Please try again.",
        keywords: [],
        sentiment: "neutral",
      });
    }
  },
});