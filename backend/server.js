const express = require('express');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Cache-Header-Middleware, um Caching zu verhindern
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
});

// Endpoint für Bundesgesetzblätter Teil I
app.get('/api/bundesgesetzblaetter', async (req, res) => {
  console.log('Anfrage an /api/bundesgesetzblaetter empfangen');
  
  try {
    const url = "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht";
    
    const body = {
      Applikation: "BgblAuth",
      Teil: {
        SucheInTeil1: true
      },
      DokumenteProSeite: "Ten",
      Sortierung: {
        SortDirection: "Descending",
        SortedByColumn: "Kundmachungsdatum"
      },
      Seitennummer: 1
    };

    console.log('Sende Anfrage an RIS API...');
    
    // RIS API abfragen
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(`RIS API Fehler: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('RIS API Antwort erhalten');
    
    if (!data.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference) {
      console.error('Keine Dokumente in der RIS-Antwort gefunden');
      throw new Error("Keine Dokumente gefunden");
    }

    const results = data.OgdSearchResult.OgdDocumentResults.OgdDocumentReference;
    console.log(`${results.length} Dokumente gefunden`);
    
    const xmlContents = [];

    // Für jedes Dokument die XML-URL finden und den Inhalt abrufen
    for (const doc of results) {
      try {
        const metadata = doc.Data.Metadaten;
        const bgblInfo = metadata.Bundesrecht.BgblAuth;
        console.log(`Verarbeite: ${bgblInfo.Bgblnummer}`);
        
        const mainDoc = doc.Data.Dokumentliste?.ContentReference;
        if (mainDoc?.Urls?.ContentUrl) {
          const contentUrls = Array.isArray(mainDoc.Urls.ContentUrl) 
            ? mainDoc.Urls.ContentUrl 
            : [mainDoc.Urls.ContentUrl];
            
          const xmlUrl = contentUrls.find(url => url.DataType === "Xml")?.Url;
          
          if (xmlUrl) {
            console.log(`XML URL gefunden: ${xmlUrl}`);
            const xmlResponse = await fetch(xmlUrl);
            if (xmlResponse.ok) {
              console.log(`XML für ${bgblInfo.Bgblnummer} erfolgreich abgerufen`);
              const xmlText = await xmlResponse.text();
              xmlContents.push({
                metadata: {
                  bgblNummer: bgblInfo.Bgblnummer,
                  titel: metadata.Bundesrecht.Titel,
                  datum: bgblInfo.Ausgabedatum,
                  typ: bgblInfo.Typ
                },
                xml: xmlText
              });
            } else {
              console.error(`Fehler beim Abrufen des XML für ${bgblInfo.Bgblnummer}: ${xmlResponse.status}`);
            }
          } else {
            console.error(`Keine XML-URL für ${bgblInfo.Bgblnummer} gefunden`);
          }
        } else {
          console.error(`Keine ContentReference für ${bgblInfo.Bgblnummer} gefunden`);
        }
      } catch (docErr) {
        console.error(`Fehler beim Verarbeiten eines Dokuments: ${docErr.message}`);
      }
    }

    console.log(`Insgesamt ${xmlContents.length} XML-Dokumente abgerufen`);
    
    // Sende die XML-Inhalte als JSON-Response
    res.json({
      success: true,
      count: xmlContents.length,
      documents: xmlContents
    });

  } catch (err) {
    console.error("Fehler beim Abrufen der Bundesgesetzblätter:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Füge einen Testendpoint hinzu
app.get('/api/test', (req, res) => {
  console.log('Testendpoint aufgerufen');
  res.json({
    success: true,
    message: 'API funktioniert'
  });
});

// Starte den Server
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
  console.log(`Verfügbare Endpoints:`);
  console.log(`- GET /api/bundesgesetzblaetter - Bundesgesetzblätter Teil I abrufen`);
  console.log(`- GET /api/test - API-Test`);
}); 