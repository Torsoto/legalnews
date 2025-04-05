const fetch = require("node-fetch");

async function fetchKundmachungen() {
  const url = "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht/brkons";

  const body = {
    Applikation: "BgblAuth",
    Sortierung: {
      SortDirection: "Descending",
      SortedByColumn: "Kundmachungsdatum"
    },
    DokumenteProSeite: 1,
    Seitennummer: 1
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Log the entire response to understand its structure
    console.log("🔍 API Response:", JSON.stringify(data, null, 2));

    console.log("📜 Aktuelle Kundmachungen:");
    data.OgdSearchResult.OgdDocumentResults.forEach((doc, index) => {
      console.log(`\n🔸 #${index + 1}`);
      console.log("Titel:", doc.Data.Metadaten.Titel);
      console.log("Kundmachungsdatum:", doc.Data.Metadaten.Kundmachung?.Datum);
      console.log("Druckansicht (PDF/RTF):", doc.Dokumentliste?.ContentReference?.Urls);
    });
  } catch (err) {
    console.error("❌ Fehler beim Abrufen:", err.message);
  }
}

fetchKundmachungen();
