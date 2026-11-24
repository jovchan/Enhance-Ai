import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Fallbacks for common writing contexts to ensure interactive experience if API Key is not set or rate limited.
const MOCK_COMPLETIONS: { [key: string]: string[] } = {
  "how to": [
    " build a successful SaaS in 2026",
    " grow your newsletter audience fast",
    " design clean user interfaces"
  ],
  "in this": [
    " article, we will examine the future of AI writing.",
    " post, I will share the exact strategies used.",
    " guide, we will walk through the implementation."
  ],
  "the key to": [
    " consistency is setting daily writing goals.",
    " professional writing is simplicity and focus.",
    " engaging content is knowing your reader's pain points."
  ],
  "artificial intelligence is": [
    " reshaping how we express our thoughts.",
    " a powerful assistant for content creators.",
    " enabling faster research and drafting cycles."
  ]
};

function getMockAutocomplete(text: string): string {
  const clean = text.trim().toLowerCase();
  for (const [key, options] of Object.entries(MOCK_COMPLETIONS)) {
    if (clean.endsWith(key) || key.startsWith(clean)) {
      const idx = Math.floor(Math.random() * options.length);
      return options[idx];
    }
  }
  // Generic completions based on character count or general structure
  const genericCompletions = [
    " and enhance your creative writing process.",
    " to reach a wider audience across social channels.",
    " with actionable insights and deep research.",
    " that resonates with readers from day one.",
    " of technical copywriting in the digital era."
  ];
  return genericCompletions[Math.floor(Math.random() * genericCompletions.length)];
}

export async function POST(req: NextRequest) {
  let text = "";
  let title = "";
  try {
    const rawData = await req.json();
    text = rawData.text || "";
    title = rawData.title || "";
  } catch {
    // ignore parse error
  }

  if (!text || text.trim() === "") {
    return NextResponse.json({ suggestion: "" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Graceful fallback if api key is missing or is the default placeholder
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    const fallback = getMockAutocomplete(text);
    return NextResponse.json({ suggestion: fallback, isDemo: true });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const contextPrompt = `
You are an expert writing assistant for the SaaS "Enhanced-AI". 
The user is drafting a blog article titled "${title || "Untitled Article"}".
Below is the current content of their draft up to their cursor position. Complete the sentence naturally with exactly 3 to 6 words.
Do NOT repeat any text the user has already written. Return ONLY the predicted completion without quotes. Keep it clean and grammatically aligned.

Current content text:
"""
${text}
"""

Predicted completion:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: contextPrompt }]
        }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 60,
        temperature: 0.3,
      }
    });

    let suggestion = response.text?.trim() || "";
    // Remove wrapping quotes if any
    suggestion = suggestion.replace(/^["'`]+|["'`]+$/g, "");
    
    // Ensure proper leading whitespace if preceding text ends with non-whitespace
    if (suggestion && text.length > 0 && !/\s$/.test(text) && !/^\s/.test(suggestion)) {
      suggestion = " " + suggestion;
    }

    return NextResponse.json({ suggestion });
  } catch (err: any) {
    console.error("Autocomplete API Error (falling back to Mock):", err);
    const fallback = getMockAutocomplete(text);
    return NextResponse.json({ suggestion: fallback, isDemo: true, note: "API fallback details active" });
  }
}
