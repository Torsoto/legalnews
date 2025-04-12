import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { gemini20FlashLite, googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";

dotenv.config();

// Configure Genkit instance
const ai = genkit({
  plugins: [googleAI()],
  model: gemini20FlashLite,
});

// Kategorien einlesen
function loadCategoriesFromFile() {
  const filePath = path.join(process.cwd(), "kategorien.txt");
  const content = fs.readFileSync(filePath, "utf-8");

  const categories = {};
  let currentCategory = null;

  content.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;

    if (!line.startsWith("•")) {
      currentCategory = line.replace(":", "").trim();
      categories[currentCategory] = [];
    } else if (currentCategory) {
      categories[currentCategory].push(line.replace("•", "").trim());
    }
  });

  return categories;
}

const categories = loadCategoriesFromFile();

function buildCategoryPromptText() {
  return Object.entries(categories)
    .map(
      ([category, examples]) =>
        `${category}:\n${examples.map((e) => `- ${e}`).join("\n")}`
    )
    .join("\n\n");
}

async function summarizeWithGemini(originalText) {
  try {
    const categoryExamples = buildCategoryPromptText();

    const prompt = `Du bist ein Experte für österreichisches Recht. Bitte fasse diesen Gesetzestext in maximal 3 kurzen, verständlichen Sätzen zusammen **und schlage eine passende rechtliche Kategorie basierend auf den unten stehenden Beispielen vor**.

    Gesetzestext:
    ${originalText}

    Verfügbare Kategorien mit Beispielen:
    ${categoryExamples}

    Antwortformat:
    Zusammenfassung: <Deine Zusammenfassung>
    Kategorie: <Kategorie-Name>`;

    const { text } = await ai.generate({
      prompt: prompt,
      maxOutputTokens: 300,
      temperature: 0.7,
    });

    // Trennen der beiden Teile (Zusammenfassung + Kategorie)
    const match = text.match(/Zusammenfassung:\s*(.*?)\nKategorie:\s*(.*)/s);

    if (match) {
      return {
        summary: match[1].trim(),
        category: match[2].trim(),
      };
    }

    return {
      summary: text.trim(),
      category: "Bundesrecht", // fallback
    };
  } catch (error) {
    console.error("Fehler beim Aufruf der Gemini-API:", error.message);
    return {
      summary: "Zusammenfassung konnte nicht generiert werden.",
      category: "Bundesrecht",
    };
  }
}

export { summarizeWithGemini };
