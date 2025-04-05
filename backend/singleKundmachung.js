const fetch = require("node-fetch");

async function fetchSingleKundmachung() {
  const url = "https://data.bka.gv.at/ris/api/v2.6/Bezirke#Bvb";

  const headers = {
    "accept": "application/json",
    "Content-Type": "application/x-www-form-urlencoded"
  };

  const body = new URLSearchParams({
    Bundesland: "Niederösterreich",
    Suchworte: "",
    Titel: "COVID",
    Applikation: "Bvb",
    Bezirksverwaltungsbehoerde: "",
    DokumenteProSeite: "Ten",
    Kundmachungsdatum: JSON.stringify({
      "Kundmachungsdatum.Von": "2025-04-05",
      "Kundmachungsdatum.Bis": "2025-04-05"
    }),
    Kundmachungsnummer: "2/2021",
    ImRisSeit: "",
    Sortierung: JSON.stringify({
      "Sortierung.SortDirection": "Ascending",
      "Sortierung.SortedByColumn": "Kundmachungsdatum"
    }),
    Seitennummer: "1"
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("🔍 API Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Fehler beim Abrufen:", err.message);
  }
}

fetchSingleKundmachung();
