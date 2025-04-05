const fetch = require("node-fetch");

async function testRIS() {
  try {
    const url =
      "https://data.bka.gv.at/ris/api/v2.6/bgbl/document?year=2024&size=5";
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const fetch = require("node-fetch");

    async function fetchKundmachungen() {
      try {
        // Endpunkt laut RIS API-Spezifikation für Bundesrecht (PostQueryBundesrecht_BrKons)
        const url = "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht/brkons";

        // Anfrage-Body – passe die Filter ggf. an die tatsächlichen Feldnamen an!
        const requestBody = {
          query: {
            bool: {
              must: [{ term: { publikationsart: "Kundmachung" } }],
            },
          },
          size: 5, // Anzahl der Einträge, die du erhalten möchtest
          sort: [
            { publikationsdatum: "desc" }, // Sortierung: Neueste zuerst
          ],
        };

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(
            `HTTP Error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Kundmachungen:");
        console.log(JSON.stringify(data, null, 2));
      } catch (error) {
        console.error("Error fetching Kundmachungen:", error.message);
      }
    }

    fetchKundmachungen();

    console.log("📄 Erhaltene BGBl-Dokumente:");
    data.results.forEach((entry, index) => {
      console.log(`\n🔹 #${index + 1}`);
      console.log("Titel:", entry.title);
      console.log("Veröffentlicht am:", entry.datePublished);
      console.log("Dokument-ID:", entry.id);
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der RIS-Daten:", error.message);
  }
}

testRIS();
