import dotenv from "dotenv";
import { gemini20FlashLite, googleAI } from '@genkit-ai/googleai';
import { genkit } from "genkit";

dotenv.config();

// Configure Genkit instance
const ai = genkit({
  plugins: [googleAI()],
  model: gemini20FlashLite,
});

async function summarizeWithGemini(originalText) {
  try {
    const prompt = `Du bist ein Experte für österreichisches Recht. Bitte fasse diesen Gesetzestext in maximal 3 kurzen, verständlichen Sätzen zusammen:

${originalText}`;

    const { text } = await ai.generate({
      prompt: prompt,
      maxOutputTokens: 200,
      temperature: 0.7
    });

    return text;
  } catch (error) {
    console.error("Fehler beim Aufruf der Gemini-API:", error.message);
    return "Zusammenfassung konnte nicht generiert werden.";
  }
}

export { summarizeWithGemini };

