import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { gemini20FlashLite, googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";
import fetch from "node-fetch";

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

      const prompt = `
      Du bist ein Experte für österreichisches Recht. Bitte fasse diesen Gesetzestext in wenigen kurzen, verständlichen Sätzen zusammen **und schlage passende rechtliche Kategorien basierend auf den unten stehenden Beispielen vor**.

      Gesetzestext:
      ${originalText}

      Verfügbare Kategorien mit Beispielen:
      ${categoryExamples}

      Antwortformat:
      Zusammenfassung: <Deine Zusammenfassung>
      Kategorie: <Liste aller passenden Kategorien, durch Komma und Leerzeichen getrennt, z.B.: "Verwaltungsrecht, Sozialrecht, Steuerrecht">`;

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

  /**
   * Extract affected laws and their publication details from legal text
   * @param {string} originalText - Original legal text including title and articles
   * @param {string} bgblNumber - The BGBl number of the document
   * @returns {Promise<Array>} - Array of objects with law title and publication details
   */
  async extractAffectedLawsWithAI(originalText, bgblNumber) {
    try {
      console.log(`Using AI to extract affected laws from ${bgblNumber}`);
      
      // Direkte Extraktion bekannter Gesetzesmuster aus dem Text
      const directlyExtractedLaws = this.extractLawsDirectlyFromText(originalText);
      console.log(`Directly extracted ${directlyExtractedLaws.length} laws from text`);
      
      // Prüfen, ob es sich um ein Landesgesetz handelt
      const isStateLaw = bgblNumber.includes("LGBl.");
      
      let prompt;
      
      if (isStateLaw) {
        prompt = `
        Du bist ein Experte für österreichisches Recht, insbesondere Landesrecht. Bitte analysiere diesen Gesetzestext und identifiziere ALLE Landesgesetze, die durch dieses Landesgesetzblatt geändert werden.

        Gesetzestext:
        ${originalText}

        Bitte nenne für JEDES betroffene Landesgesetz:
        1. Den vollständigen Namen des Gesetzes (z.B. "Wiener Bauordnung", "Tiroler Raumordnungsgesetz", "Steiermärkisches Jugendgesetz").
        2. Die KORREKTE Kundmachungsnummer im Format "XX/YYYY" (z.B. "13/2014" oder "56/2008"), die zu diesem Gesetz gehört.

        WICHTIG:
        - Jedes Gesetz hat eine EINZIGARTIGE, UNTERSCHIEDLICHE Kundmachungsnummer.
        - Landesgesetze beginnen oft mit dem Namen des Bundeslandes (z.B. "Wiener", "Tiroler").
        - Verwende NICHT dieselbe Kundmachungsnummer für verschiedene Gesetze.
        - Wenn keine Artikel vorkommen, dann gibt es im ganzen Gesetzblatt nur ein Gesetz und dessen passende Kundmachungsnummer.
        - Suche besonders nach Formulierungen wie "Änderung des [Name des Gesetzes]" oder "Das [Name des Gesetzes], LGBl. Nr. XX/YYYY wird wie folgt geändert".
        
        Hier sind Beispiele für korrekte Identifikationen von Landesgesetzen:
        
        Beispiel 1:
        Gesetz: Wiener Jugendschutzgesetz
        Kundmachungsnummer: 17/2002
        
        Beispiel 2:
        Gesetz: Tiroler Raumordnungsgesetz
        Kundmachungsnummer: 27/2006
        
        Antwortformat:
        Gesetz 1: <Name des Gesetzes>
        Kundmachungsnummer 1: <Nummer/Jahr>
        
        Gesetz 2: <Name des Gesetzes>
        Kundmachungsnummer 2: <Nummer/Jahr>
        
        usw.
        `;
      } else {
        // Standard-Prompt für Bundesgesetzblätter
        prompt = `
        Du bist ein Experte für österreichisches Recht. Bitte analysiere diesen Gesetzestext und identifiziere ALLE Gesetze, die durch dieses Bundesgesetzblatt geändert werden.

        Gesetzestext:
        ${originalText}

        Bitte nenne für JEDES betroffene Gesetz:
        1. Den vollständigen Namen des Gesetzes (z.B. "Allgemeines Bürgerliches Gesetzbuch", "Straßenverkehrsordnung", "Einkommensteuergesetz").
        2. Die KORREKTE Kundmachungsnummer im Format "XX/YYYY" (z.B. "520/1981" oder "76/1986"), die zu diesem Gesetz gehört.

        WICHTIG:
        - Jedes Gesetz hat eine EINZIGARTIGE, UNTERSCHIEDLICHE Kundmachungsnummer.
        - Verwende NICHT dieselbe Kundmachungsnummer für verschiedene Gesetze.
        - Wenn keine Artikel vorkommen, dann gibt es im ganzen Gesetzblatt nur ein Gesetz und dessen passende Kundmachungsnummer.
        - Gesetze haben meist einen offiziellen Namen, der aus mehreren Wörtern besteht.
        - Wenn mehrere Gesetze betroffen sind (z.B. in verschiedenen Artikeln), liste ALLE einzeln auf.
        - Suche besonders nach Formulierungen wie "Änderung des [Name des Gesetzes]" oder "Das [Name des Gesetzes], BGBl. Nr. XX/YYYY wird wie folgt geändert".
        
        Hier sind Beispiele für korrekte Identifikationen:
        
        Beispiel 1:
        Gesetz: Allgemeines Bürgerliches Gesetzbuch
        Kundmachungsnummer: 946/1811
        
        Beispiel 2:
        Gesetz: Einkommensteuergesetz
        Kundmachungsnummer: 400/1988
        
        Antwortformat:
        Gesetz 1: <Name des Gesetzes>
        Kundmachungsnummer 1: <Nummer/Jahr>
        
        Gesetz 2: <Name des Gesetzes>
        Kundmachungsnummer 2: <Nummer/Jahr>
        
        usw.
        `;
      }

      const { text } = await this.ai.generate({
        prompt: prompt,
        maxOutputTokens: 800,
        temperature: 0.0,
      });

      console.log(`AI extraction result for ${bgblNumber}:`, text);
      
      // Parse the response to extract laws and publication numbers
      let laws = [];
      
      // Verbesserte Regex zur Erfassung verschiedener Formatierungen
      const lawMatches = text.matchAll(/Gesetz\s*\d*:?\s*([^\n]+)\s*\n+\s*Kundmachungsnummer\s*\d*:?\s*([^\n]+)/gi);
      
      for (const match of lawMatches) {
        const title = match[1].trim();
        const publicationNumber = match[2].trim();
        
        if (title && publicationNumber) {
          laws.push({
            title: title,
            publicationOrgan: isStateLaw ? "LGBl. Nr." : "BGBl. Nr.",
            publicationNumber: publicationNumber
          });
          
          console.log(`AI found affected law: ${title}, ${isStateLaw ? "LGBl." : "BGBl."} Nr., ${publicationNumber}`);
        }
      }
      
      // Fallback-Extraktion, falls keine Treffer mit dem primären Muster
      if (laws.length === 0) {
        const fallbackMatches = text.matchAll(/(?:^|\n)([^:\n]+)(?::|,)\s*([^,\n]+)(?:,|\n)/g);
        for (const match of fallbackMatches) {
          const potentialTitle = match[1].trim();
          const potentialNumber = match[2].trim();
          
          // Prüfen, ob das potentielle Format einer Kundmachungsnummer entspricht
          if (potentialTitle && potentialNumber && /\d+\/\d{4}/.test(potentialNumber)) {
            laws.push({
              title: potentialTitle,
              publicationOrgan: isStateLaw ? "LGBl. Nr." : "BGBl. Nr.",
              publicationNumber: potentialNumber
            });
            
            console.log(`Fallback extraction found law: ${potentialTitle}, ${potentialNumber}`);
          }
        }
      }
      
      // Kombiniere und validiere Ergebnisse
      laws = this.mergeAndValidateLaws([...laws, ...directlyExtractedLaws]);
      
      return laws;
    } catch (error) {
      console.error("Error extracting affected laws with AI:", error.message);
      return [];
    }
  }
  
  /**
   * Extrahiert Gesetze direkt aus dem Text mit regulären Ausdrücken
   * @param {string} text - Der zu analysierende Text
   * @returns {Array} - Liste der extrahierten Gesetze
   */
  extractLawsDirectlyFromText(text) {
    const laws = [];
    const patterns = [
      // Muster 1: "Änderung des [Gesetzesname], BGBl. Nr. XX/YYYY"
      /Änderung\s+des\s+([^,]+),\s+BGBl\.\s+(?:Nr\.\s+)?(\d+\/\d{4})/gi,
      
      // Muster 2: "[Gesetzesname], BGBl. Nr. XX/YYYY, wird wie folgt geändert"
      /([^,]+),\s+BGBl\.\s+(?:Nr\.\s+)?(\d+\/\d{4}),\s+wird\s+(?:wie\s+folgt\s+)?geändert/gi,
      
      // Muster 3: "Das [Gesetzesname] (BGBl. Nr. XX/YYYY)"
      /Das\s+([^(]+)\s+\(BGBl\.\s+(?:Nr\.\s+)?(\d+\/\d{4})\)/gi,
      
      // Muster 4: "[Gesetzesname] (BGBl. Nr. XX/YYYY)"
      /([^(]+)\s+\(BGBl\.\s+(?:Nr\.\s+)?(\d+\/\d{4})\)/gi,
      
      // Muster für Landesgesetze: "Änderung des [Gesetzesname], LGBl. Nr. XX/YYYY"
      /Änderung\s+des\s+([^,]+),\s+LGBl\.\s+(?:Nr\.\s+)?(\d+\/\d{4})/gi,
      
      // Muster für Landesgesetze: "[Gesetzesname], LGBl. Nr. XX/YYYY, wird wie folgt geändert"
      /([^,]+),\s+LGBl\.\s+(?:Nr\.\s+)?(\d+\/\d{4}),\s+wird\s+(?:wie\s+folgt\s+)?geändert/gi,
      
      // Muster für Landesgesetze: "Das [Gesetzesname] (LGBl. Nr. XX/YYYY)"
      /Das\s+([^(]+)\s+\(LGBl\.\s+(?:Nr\.\s+)?(\d+\/\d{4})\)/gi,
      
      // Muster für Landesgesetze: "[Gesetzesname] (LGBl. Nr. XX/YYYY)"
      /([^(]+)\s+\(LGBl\.\s+(?:Nr\.\s+)?(\d+\/\d{4})\)/gi
    ];
    
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const title = match[1].trim();
        const publicationNumber = match[2].trim();
        
        if (title && publicationNumber) {
          const isLandesrecht = pattern.source.includes("LGBl");
          laws.push({
            title: title,
            publicationOrgan: isLandesrecht ? "LGBl. Nr." : "BGBl. Nr.",
            publicationNumber: publicationNumber,
            source: "direct_extraction"
          });
          
          console.log(`Directly extracted ${isLandesrecht ? "state" : "federal"} law: ${title}, ${isLandesrecht ? "LGBl." : "BGBl."} Nr., ${publicationNumber}`);
        }
      }
    }
    
    return laws;
  }
  
  /**
   * Kombiniert und validiert die extrahierten Gesetze
   * @param {Array} laws - Liste der extrahierten Gesetze
   * @returns {Array} - Bereinigte Liste von Gesetzen
   */
  mergeAndValidateLaws(laws) {
    if (!laws || laws.length === 0) return [];
    
    const uniqueLaws = new Map();
    const knownPatterns = {
      // Korrigiert häufige Formatierungsfehler und Falschschreibweisen
      "Strassenverkehrsordnung": "Straßenverkehrsordnung",
      "StVO": "Straßenverkehrsordnung"
      // Weitere Korrekturen können hier hinzugefügt werden
    };
    
    for (const law of laws) {
      // Normalisiere den Titel
      let title = law.title;
      
      // Korrigiere bekannte Falschschreibweisen
      Object.keys(knownPatterns).forEach(pattern => {
        if (title.includes(pattern)) {
          title = knownPatterns[pattern];
        }
      });
      
      // Entferne spezifische Präfixe wie "Bundesgesetz" wenn sie allein stehen
      if (title === "Bundesgesetz") continue;
      
      // Normalisiere die Kundmachungsnummer
      let publicationNumber = law.publicationNumber;
      
      // Validiere das Format der Kundmachungsnummer (XX/YYYY)
      if (!publicationNumber.match(/^\d+\/\d{4}$/)) {
        // Versuche eine Korrektur, wenn das Format ähnlich ist
        const numberMatch = publicationNumber.match(/(\d+)[^\d]+(\d{4})/);
        if (numberMatch) {
          publicationNumber = `${numberMatch[1]}/${numberMatch[2]}`;
        } else {
          // Überspringe diese Gesetzesreferenz, wenn die Nummer nicht korrigierbar ist
          continue;
        }
      }
      
      // Erstelle einen Schlüssel für die Map, um Duplikate zu vermeiden
      const key = `${title}|${publicationNumber}`;
      
      // Wenn der Eintrag bereits existiert, bevorzuge den direkt extrahierten
      if (!uniqueLaws.has(key) || law.source === "direct_extraction") {
        uniqueLaws.set(key, {
          title: title,
          publicationOrgan: law.publicationOrgan,
          publicationNumber: publicationNumber
        });
      }
    }
    
    // Konvertiere die Map zurück in ein Array
    return Array.from(uniqueLaws.values());
  }

  /**
   * Extract affected laws from document title
   * @param {string} documentTitle - Title of the legal document
   * @param {string} bgblNumber - BGBl/LGBl number
   * @param {boolean} isStateLaw - Whether this is a state law
   * @returns {Promise<Array>} - Array of affected laws with URLs
   */
  async extractLawsFromTitle(documentTitle, bgblNumber, isStateLaw) {
    console.log(`Extracting laws from title: "${documentTitle}"`);
    
    // Extract law names from document title
    const lawNames = this.parseLawsFromTitle(documentTitle);
    console.log(`Parsed ${lawNames.length} law names from title: ${lawNames.join(', ')}`);
    
    if (lawNames.length === 0) {
      console.log("No laws found in title, falling back to AI extraction");
      // Fall back to AI extraction if no laws found in title
      return this.extractAffectedLawsWithAI(documentTitle, bgblNumber);
    }
    
    // Get details for each law using direct API lookup
    const laws = [];
    
    for (const lawName of lawNames) {
      try {
        // Lookup details from RIS API
        console.log(`Looking up details for law: "${lawName}"`);
        const lawDetails = await this.fetchLawDetailsFromRIS(lawName, isStateLaw);
        
        if (lawDetails) {
          console.log(`Found details for "${lawName}": ${JSON.stringify(lawDetails)}`);
          laws.push(lawDetails);
        } else {
          console.log(`No details found for "${lawName}", adding with minimal info`);
          // Add with minimal information if not found
          laws.push({
            title: lawName,
            publicationOrgan: isStateLaw ? "LGBl. Nr." : "BGBl. Nr.",
            publicationNumber: null
          });
        }
      } catch (error) {
        console.error(`Error fetching details for "${lawName}":`, error.message);
      }
    }
    
    return laws;
  }
  
  /**
   * Parse law names from document title
   * @param {string} title - Title of the legal document
   * @returns {Array<string>} - Array of law names
   */
  parseLawsFromTitle(title) {
    const lawNames = [];
    
    // Common patterns for document titles
    const patterns = [
      // "mit dem das X und das Y geändert werden"
      {
        regex: /mit dem das ([^,]+) und das ([^,]+) geändert werden/i,
        extract: (match) => [match[1].trim(), match[2].trim()]
      },
      // "mit dem das X, das Y und das Z geändert werden"
      {
        regex: /mit dem das ([^,]+), das ([^,]+) und das ([^,]+) geändert werden/i,
        extract: (match) => [match[1].trim(), match[2].trim(), match[3].trim()]
      },
      // "mit dem das X geändert wird"
      {
        regex: /mit dem das ([^,]+) geändert wird/i,
        extract: (match) => [match[1].trim()]
      },
      // "Änderung des X"
      {
        regex: /Änderung des ([^,]+)/i,
        extract: (match) => [match[1].trim()]
      }
    ];
    
    // Try each pattern
    for (const pattern of patterns) {
      const match = title.match(pattern.regex);
      if (match) {
        const extractedNames = pattern.extract(match);
        extractedNames.forEach(name => {
          // Clean the name (remove "Bundesgesetz" etc. if not part of the actual name)
          const cleanName = this.cleanLawName(name);
          if (cleanName) {
            lawNames.push(cleanName);
          }
        });
        
        // If we found names, we can stop
        if (lawNames.length > 0) {
          break;
        }
      }
    }
    
    return lawNames;
  }
  
  /**
   * Clean a law name by removing unnecessary prefixes
   * @param {string} name - Raw law name
   * @returns {string} - Cleaned law name
   */
  cleanLawName(name) {
    // Remove common prefixes if they're standalone
    const prefixesToRemove = [
      /^Bundesgesetz\s+/i,
      /^Gesetz\s+/i
    ];
    
    let cleanedName = name;
    for (const prefix of prefixesToRemove) {
      cleanedName = cleanedName.replace(prefix, '');
    }
    
    // Check if the name is too short after cleaning (likely not a valid law name)
    if (cleanedName.length < 5) {
      return null;
    }
    
    return cleanedName.trim();
  }
  
  /**
   * Fetch law details from RIS API
   * @param {string} lawName - Name of the law
   * @param {boolean} isStateLaw - Whether this is a state law
   * @returns {Promise<Object|null>} - Law details or null if not found
   */
  async fetchLawDetailsFromRIS(lawName, isStateLaw) {
    try {
      // Construct the API URL
      const baseUrl = isStateLaw 
        ? "https://data.bka.gv.at/ris/api/v2.6/Landesrecht"
        : "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht";
      
      const encodedTitle = encodeURIComponent(lawName);
      const url = `${baseUrl}?Applikation=BrKons&Titel=${encodedTitle}`;
      
      console.log(`Fetching from RIS API: ${url}`);
      
      // Make the API request
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        console.error(`HTTP Error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      // Check if we have results
      if (!data.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference) {
        console.log(`No results found for "${lawName}"`);
        return null;
      }
      
      // Find the best match - look for exact title match first
      const references = data.OgdSearchResult.OgdDocumentResults.OgdDocumentReference;
      
      // Look for an exact match of the Kurztitel
      const exactMatch = references.find(ref => {
        const metadata = isStateLaw 
          ? ref.Data?.Metadaten?.Landesrecht
          : ref.Data?.Metadaten?.Bundesrecht;
        
        return metadata?.Kurztitel === lawName;
      });
      
      if (exactMatch) {
        // Extract relevant data
        const metadata = isStateLaw
          ? exactMatch.Data?.Metadaten?.Landesrecht
          : exactMatch.Data?.Metadaten?.Bundesrecht;
        
        const brKons = isStateLaw
          ? metadata?.LrKons
          : metadata?.BrKons;
          
        if (brKons) {
          return {
            title: lawName,
            publicationOrgan: brKons.StammnormPublikationsorgan || (isStateLaw ? "LGBl. Nr." : "BGBl. Nr."),
            publicationNumber: brKons.StammnormBgblnummer,
            consolidatedVersionUrl: brKons.GesamteRechtsvorschriftUrl || null,
            gesetzesnummer: brKons.Gesetzesnummer || null
          };
        }
      }
      
      // If no exact match, try partial match
      for (const ref of references) {
        const metadata = isStateLaw
          ? ref.Data?.Metadaten?.Landesrecht
          : ref.Data?.Metadaten?.Bundesrecht;
          
        const brKons = isStateLaw
          ? metadata?.LrKons
          : metadata?.BrKons;
          
        if (brKons && metadata.Kurztitel && metadata.Kurztitel.includes(lawName)) {
          return {
            title: metadata.Kurztitel,
            publicationOrgan: brKons.StammnormPublikationsorgan || (isStateLaw ? "LGBl. Nr." : "BGBl. Nr."),
            publicationNumber: brKons.StammnormBgblnummer,
            consolidatedVersionUrl: brKons.GesamteRechtsvorschriftUrl || null,
            gesetzesnummer: brKons.Gesetzesnummer || null
          };
        }
      }
      
      // If still no match, use the first result as a fallback
      if (references.length > 0) {
        const firstRef = references[0];
        const metadata = isStateLaw
          ? firstRef.Data?.Metadaten?.Landesrecht
          : firstRef.Data?.Metadaten?.Bundesrecht;
          
        const brKons = isStateLaw
          ? metadata?.LrKons
          : metadata?.BrKons;
          
        if (brKons) {
          return {
            title: metadata.Kurztitel || lawName,
            publicationOrgan: brKons.StammnormPublikationsorgan || (isStateLaw ? "LGBl. Nr." : "BGBl. Nr."),
            publicationNumber: brKons.StammnormBgblnummer,
            consolidatedVersionUrl: brKons.GesamteRechtsvorschriftUrl || null,
            gesetzesnummer: brKons.Gesetzesnummer || null
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching law details for "${lawName}":`, error.message);
      return null;
    }
  }
  
  /**
   * Extract effective dates for affected laws
   * @param {string} originalText - Full legal text
   * @param {string} bgblNumber - BGBl/LGBl number
   * @param {string} publicationDate - Publication date in ISO format
   * @param {Array} affectedLaws - Array of affected laws
   * @returns {Promise<Array>} - Updated laws with effective dates
   */
  async extractEffectiveDates(originalText, bgblNumber, publicationDate, affectedLaws) {
    try {
      console.log(`Extracting effective dates for ${bgblNumber}`);
      
      if (!affectedLaws || affectedLaws.length === 0) {
        console.log("No affected laws to extract effective dates for");
        return [];
      }
      
      // Calculate default effective date (day after publication)
      const nextDay = new Date(publicationDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const defaultEffectiveDate = nextDay.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log(`Default effective date (day after publication): ${defaultEffectiveDate}`);
      
      // Create a prompt that only focuses on effective dates to save tokens
      const prompt = `
      Du bist ein Experte für österreichisches Recht. Analysiere diesen Gesetzestext und extrahiere GENAU, wann die verschiedenen Bestimmungen in Kraft treten.

      Gesetzestext:
      ${originalText}

      Für JEDE Bestimmung oder jeden Paragraphen, gib an:
      1. Den betroffenen Paragraphen (z.B. "§ 10", "§ 33 TP 17 Abs. 1 Z 1")
      2. Das genaue Datum des Inkrafttretens im Format YYYY-MM-DD

      WICHTIG:
      - Wenn ein Paragraph "mit dem der Kundmachung folgenden Tag in Kraft" tritt, dann ist das Datum ${defaultEffectiveDate}.
      - Wenn ein Paragraph "mit Ablauf des Tages der Kundmachung in Kraft" tritt, dann ist das Datum ${publicationDate}.
      - Wenn ein spezifisches Datum genannt wird (z.B. "mit 1. April 2025"), wandle dieses in YYYY-MM-DD Format um.
      - Wenn für einen Teil keine explizite Angabe existiert, gilt standardmäßig der Tag nach Veröffentlichung (${defaultEffectiveDate}).

      Antwortformat:
      Paragraph: [Paragraph-Angabe]
      Inkrafttreten: [YYYY-MM-DD]

      Paragraph: [Paragraph-Angabe]
      Inkrafttreten: [YYYY-MM-DD]

      usw.
      `;

      const { text } = await this.ai.generate({
        prompt: prompt,
        maxOutputTokens: 500,
        temperature: 0.0,
      });

      // Parse the results to get paragraph -> date mapping
      const dateMatches = Array.from(text.matchAll(/Paragraph:\s*([^\n]+)\s*\nInkrafttreten:\s*(\d{4}-\d{2}-\d{2})/g));
      const effectiveDateMap = new Map();
      
      // Store effective dates by paragraph
      for (const match of dateMatches) {
        const section = match[1].trim();
        const effectiveDate = match[2].trim();
        
        if (section && effectiveDate) {
          effectiveDateMap.set(section, effectiveDate);
          console.log(`Found effective date for section ${section}: ${effectiveDate}`);
        }
      }
      
      // Update the affected laws with effective dates
      const updatedLaws = affectedLaws.map(law => {
        const lawWithDate = { ...law };
        let effectiveDate = null;
        
        // Try to find the most specific section reference for this law
        for (const [section, date] of effectiveDateMap.entries()) {
          // Check if the section specifically mentions this law
          const lawNameWords = law.title.toLowerCase().split(' ');
          const sectionLower = section.toLowerCase();
          
          const matchesLaw = lawNameWords.some(word => 
            word.length > 3 && sectionLower.includes(word)
          );
          
          if (matchesLaw) {
            effectiveDate = date;
            lawWithDate.section = section;
            break;
          }
        }
        
        // If no specific reference found, use the first section or default date
        if (!effectiveDate) {
          // Use the first extracted section if available
          if (effectiveDateMap.size > 0) {
            const [firstSection, firstDate] = Array.from(effectiveDateMap.entries())[0];
            lawWithDate.section = firstSection;
            effectiveDate = firstDate;
          } else {
            // No effective dates found at all, use default
            effectiveDate = defaultEffectiveDate;
          }
        }
        
        lawWithDate.effectiveDate = effectiveDate;
        return lawWithDate;
      });
      
      return updatedLaws;
    } catch (error) {
      console.error("Error extracting effective dates:", error.message);
      
      // Use default effective date in case of error
      const nextDay = new Date(publicationDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const defaultEffectiveDate = nextDay.toISOString().split('T')[0];
      
      return affectedLaws.map(law => ({
        ...law,
        effectiveDate: defaultEffectiveDate
      }));
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

/**
 * Extract affected laws from legal text
 * @param {string} text - Legal text to analyze
 * @param {string} bgblNumber - BGBl number
 * @returns {Promise<Array>} - Array of affected laws
 */
export const extractAffectedLawsWithAI = (text, bgblNumber) => aiService.extractAffectedLawsWithAI(text, bgblNumber);

/**
 * Extract laws from document title (efficient approach)
 * @param {string} title - Document title
 * @param {string} bgblNumber - BGBl/LGBl number
 * @param {boolean} isStateLaw - Whether this is a state law
 * @returns {Promise<Array>} - Array of affected laws with details
 */
export const extractLawsFromTitle = (title, bgblNumber, isStateLaw) => 
  aiService.extractLawsFromTitle(title, bgblNumber, isStateLaw);

/**
 * Extract effective dates for affected laws
 * @param {string} text - Full legal text
 * @param {string} bgblNumber - BGBl/LGBl number 
 * @param {string} publicationDate - Publication date in ISO format
 * @param {Array} affectedLaws - Array of affected laws
 * @returns {Promise<Array>} - Updated laws with effective dates
 */
export const extractEffectiveDates = (text, bgblNumber, publicationDate, affectedLaws) =>
  aiService.extractEffectiveDates(text, bgblNumber, publicationDate, affectedLaws); 