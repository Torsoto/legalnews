import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { gemini20FlashLite, googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";

dotenv.config();

/**
 * AI service for generating summaries using Google's Gemini model
 */
class AiService {
  constructor() {
    // Configure Genkit instance
    this.ai = genkit({
      plugins: [googleAI()],
      model: gemini20FlashLite,
    });
    this.categories = this.loadCategoriesFromFile();
  }

  /**
   * Load legal categories from file
   * @returns {Object} - Categories with examples
   */
  loadCategoriesFromFile() {
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

  /**
   * Build prompt text for categorization
   * @returns {string} - Formatted category examples
   */
  buildCategoryPromptText() {
    return Object.entries(this.categories)
      .map(
        ([category, examples]) =>
          `${category}:\n${examples.map((e) => `- ${e}`).join("\n")}`
      )
      .join("\n\n");
  }

  /**
   * Generate summary and category for legal text using Gemini AI
   * @param {string} originalText - Original legal text
   * @returns {Object} - Object with summary and category
   */
  async summarizeWithGemini(originalText) {
    try {
      const categoryExamples = this.buildCategoryPromptText();

      const prompt = `Du bist ein Experte für österreichisches Recht. Bitte fasse diesen Gesetzestext in maximal 3 kurzen, verständlichen Sätzen zusammen **und schlage eine passende rechtliche Kategorie basierend auf den unten stehenden Beispielen vor**.

      Gesetzestext:
      ${originalText}

      Verfügbare Kategorien mit Beispielen:
      ${categoryExamples}

      Antwortformat:
      Zusammenfassung: <Deine Zusammenfassung>
      Kategorie: <Kategorie-Name>`;

      const { text } = await this.ai.generate({
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
}

// Create singleton instance
const aiService = new AiService();

/**
 * Generate summary and category for legal text
 * @param {string} text - Legal text to summarize
 * @returns {Promise<Object>} - Summary and category
 */
export const summarizeWithGemini = (text) => aiService.summarizeWithGemini(text); 