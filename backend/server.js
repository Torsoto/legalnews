const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const BgblXmlParser = require('./xmlParser');

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
app.get('/api/notifications', async (req, res) => {
  console.log('Anfrage an /api/notifications empfangen');
  
  try {
    const baseUrl = "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht";
    const params = new URLSearchParams({
      Applikation: "BgblAuth",
      "Teil.SucheInTeil1": "true",
      "Typ.SucheInGesetzen": "true",
      "Kundmachung.Periode": "EinemMonat"
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log('Sende Anfrage an RIS API:', url);
    
    // RIS API abfragen
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
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
    
    const notifications = [];
    const xmlParser = new BgblXmlParser();

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
              
              const notification = xmlParser.parse(xmlText, {
                Bgblnummer: bgblInfo.Bgblnummer,
                Titel: metadata.Bundesrecht.Titel,
                Ausgabedatum: bgblInfo.Ausgabedatum
              });
              
              notifications.push(notification);
            }
          }
        }
      } catch (docErr) {
        console.error(`Fehler beim Verarbeiten eines Dokuments: ${docErr.message}`);
      }
    }

    // Sende die formatierten Benachrichtigungen als JSON-Response
    res.json({
      success: true,
      count: notifications.length,
      notifications: notifications
    });

  } catch (err) {
    console.error("Fehler beim Abrufen der Benachrichtigungen:", err.message);
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
app.listen(port, '0.0.0.0', () => {
  console.log(`Server läuft auf http://localhost:${port}`);
  console.log(`Verfügbare Endpoints:`);
  console.log(`- GET /api/notifications - Bundesgesetzblätter Teil I abrufen`);
  console.log(`- GET /api/test - API-Test`);
});