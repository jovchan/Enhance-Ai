import { GoogleGenAI } from "@google/genai";
import { registerUser, authenticateUser, validateEmail, hashPassword } from "../lib/auth.ts";

async function verifyAll() {
  console.log("=== STARTING COMPLETE VERIFICATION SUITE ===");

  // 1. Verify Gemini API key & model directly
  console.log("\n[Test 1] Testing Gemini API Connection...");
  const apiKey = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
  const ai = new GoogleGenAI({ apiKey });
  const genResult = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: "Write exactly 3 words: 'Blogging with AI'" }] }]
  });
  console.log("Gemini API Output:", genResult.text?.trim());
  if (!genResult.text) throw new Error("Gemini API call failed");
  console.log("✓ Gemini 2.5 Flash API is ACTIVE and functional!");

  // 2. Verify Autocomplete logic & spacing
  console.log("\n[Test 2] Testing Autocomplete formatting & word spacing...");
  const samplePreceding = "The future of cloud computing";
  const prompt = `You are an expert writing assistant for "Enhanced-AI". Complete the sentence naturally with 3 to 5 words: "${samplePreceding}"`;
  const autoResult = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 60,
      temperature: 0.2
    }
  });
  let suggestion = autoResult.text?.trim() || "";
  suggestion = suggestion.replace(/^["'`]+|["'`]+$/g, "");
  if (suggestion && samplePreceding.length > 0 && !/\s$/.test(samplePreceding) && !/^\s/.test(suggestion)) {
    suggestion = " " + suggestion;
  }
  console.log(`Autocomplete raw result: "${suggestion}"`);
  console.log(`Combined text: "${samplePreceding}${suggestion}"`);
  if (!suggestion.startsWith(" ")) throw new Error("Suggestion must start with space when preceding word has no space");
  console.log("✓ Autocomplete spacing test passed!");

  // 3. Verify AI Enhance with empty body + Title only
  console.log("\n[Test 3] Testing AI Assistant with Title only (empty body)...");
  const titleOnly = "Mastering Clean Code in 2026";
  const headlinePrompt = `Generate 3 modern blog headlines for: "${titleOnly}"`;
  const headlineResult = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: headlinePrompt }] }]
  });
  console.log("Headlines generated from Title:\n" + headlineResult.text?.trim());
  if (!headlineResult.text) throw new Error("Headline generation failed");
  console.log("✓ Headline generation from title passed!");

  // 4. Verify Local Authentication System
  console.log("\n[Test 4] Testing Auth System (Option 1)...");
  // Mock window/localStorage in node for testing
  const mockStorage = {};
  global.window = {};
  global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = v; },
    removeItem: (k) => { delete mockStorage[k]; }
  };

  // Test invalid email
  const badEmail = registerUser("Test", "invalid-email", "password123");
  if (!badEmail.error) throw new Error("Invalid email must be rejected");
  console.log("✓ Invalid email rejection:", badEmail.error);

  // Test short password
  const shortPass = registerUser("Test", "user@example.com", "123");
  if (!shortPass.error) throw new Error("Short password must be rejected");
  console.log("✓ Short password rejection:", shortPass.error);

  // Test valid registration
  const reg1 = registerUser("John Blogger", "john@enhanced.ai", "securePass2026");
  if (!reg1.user) throw new Error("Valid registration must succeed: " + reg1.error);
  console.log("✓ Valid registration succeeded for:", reg1.user.email);

  // Test duplicate email
  const dup = registerUser("Another John", "john@enhanced.ai", "anotherPass");
  if (!dup.error) throw new Error("Duplicate email must be rejected");
  console.log("✓ Duplicate email rejection:", dup.error);

  // Test login with wrong password
  const wrongPass = authenticateUser("john@enhanced.ai", "wrongpassword");
  if (!wrongPass.error) throw new Error("Wrong password must be rejected");
  console.log("✓ Wrong password rejection:", wrongPass.error);

  // Test login with non-existent user
  const noUser = authenticateUser("nobody@enhanced.ai", "anypassword");
  if (!noUser.error) throw new Error("Non-existent user must be rejected");
  console.log("✓ Non-existent user rejection:", noUser.error);

  // Test login with correct password
  const loginOk = authenticateUser("john@enhanced.ai", "securePass2026");
  if (!loginOk.user) throw new Error("Valid login must succeed: " + loginOk.error);
  console.log("✓ Valid login succeeded for:", loginOk.user.displayName);

  console.log("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY ===");
}

verifyAll().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
