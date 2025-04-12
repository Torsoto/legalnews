import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import BgblXmlParser from "./xmlParser.js";
import { summarizeWithGemini } from "./AI.js";
import dotenv from "dotenv";
import {
  saveNotifications,
  notificationExists,
  getNotification,
} from "./service/firestoreService.js";

dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Cache-Header-Middleware, um Caching zu verhindern
app.use((req, res, next) => {
  res.header(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
});

// Endpoint für Bundesgesetzblätter Teil I
app.get("/api/notifications", async (req, res) => {
  console.log("Anfrage an /api/notifications empfangen");

  try {
    const baseUrl = "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht";
    const params = new URLSearchParams({
      Applikation: "BgblAuth",
      "Teil.SucheInTeil1": "true",
      "Typ.SucheInGesetzen": "true",
      "Kundmachung.Periode": "EinemMonat",
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log("Sende Anfrage an RIS API:", url);

    // RIS API abfragen
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `RIS API Fehler: ${response.status} ${response.statusText}`
      );
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("RIS API Antwort erhalten");

    if (!data.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference) {
      console.error("Keine Dokumente in der RIS-Antwort gefunden");
      throw new Error("Keine Dokumente gefunden");
    }

    const results =
      data.OgdSearchResult.OgdDocumentResults.OgdDocumentReference;
    console.log(`${results.length} Dokumente gefunden`);

    const notifications = [];
    const newNotifications = [];
    const xmlParser = new BgblXmlParser();

    // Für jedes Dokument die XML-URL finden und den Inhalt abrufen
    for (const doc of results) {
      try {
        const metadata = doc.Data.Metadaten;
        const bgblInfo = metadata.Bundesrecht.BgblAuth;
        const bgblNummer = bgblInfo.Bgblnummer;
        console.log(`Verarbeite: ${bgblNummer}`);

        // Prüfen, ob die Benachrichtigung bereits in Firestore existiert
        const exists = await notificationExists(bgblNummer);

        if (exists) {
          console.log(
            `Benachrichtigung ${bgblNummer} existiert bereits in Firestore, lade aus Datenbank.`
          );

          // Lade die bestehende Benachrichtigung aus Firestore
          const existingNotification = await getNotification(bgblNummer);

          if (existingNotification) {
            console.log(
              `Benachrichtigung ${bgblNummer} erfolgreich aus Firestore geladen.`
            );
            notifications.push({
              ...existingNotification,
              fromCache: true,
            });
          } else {
            // Fallback, falls getNotification fehlschlägt
            console.log(
              `Konnte Benachrichtigung ${bgblNummer} nicht aus Firestore laden, nutze Basisdaten.`
            );
            notifications.push({
              id: bgblNummer,
              Bgblnummer: bgblNummer,
              title: metadata.Bundesrecht.Titel,
              Ausgabedatum: bgblInfo.Ausgabedatum,
              fromCache: true,
            });
          }

          continue; // Überspringe weitere Verarbeitung
        }

        console.log(
          `Neue Benachrichtigung ${bgblNummer} gefunden, verarbeite XML...`
        );
        const mainDoc = doc.Data.Dokumentliste?.ContentReference;
        if (mainDoc?.Urls?.ContentUrl) {
          const contentUrls = Array.isArray(mainDoc.Urls.ContentUrl)
            ? mainDoc.Urls.ContentUrl
            : [mainDoc.Urls.ContentUrl];

          const xmlUrl = contentUrls.find((url) => url.DataType === "Xml")?.Url;

          if (xmlUrl) {
            console.log(`XML URL gefunden: ${xmlUrl}`);
            const xmlResponse = await fetch(xmlUrl);
            if (xmlResponse.ok) {
              console.log(`XML für ${bgblNummer} erfolgreich abgerufen`);
              const xmlText = await xmlResponse.text();

              const notification = xmlParser.parse(xmlText, {
                id: bgblNummer, // Setze ID für konsistenten Zugriff
                Bgblnummer: bgblNummer,
                Titel: metadata.Bundesrecht.Titel,
                Ausgabedatum: bgblInfo.Ausgabedatum,
              });

              // Generate AI summary
              console.log(`Generiere KI-Zusammenfassung für ${bgblNummer}`);
              const fullText = `${notification.title}\n${
                notification.description
              }\n${notification.articles
                .map((art) => `${art.title}\n${art.subtitle}`)
                .join("\n")}`;
              const { summary, category } = await summarizeWithGemini(fullText);
              notification.aiSummary = summary;
              notification.category = category;

              notifications.push(notification);
              newNotifications.push(notification);
            }
          }
        }
      } catch (docErr) {
        console.error(
          `Fehler beim Verarbeiten eines Dokuments: ${docErr.message}`
        );
      }
    }

    // Speichere nur neue Benachrichtigungen in Firestore
    if (newNotifications.length > 0) {
      try {
        await saveNotifications(newNotifications);
        console.log(
          `${newNotifications.length} neue Benachrichtigungen erfolgreich in Firestore gespeichert`
        );
      } catch (firestoreErr) {
        console.error(
          "Fehler beim Speichern in Firestore:",
          firestoreErr.message
        );
      }
    } else {
      console.log("Keine neuen Benachrichtigungen zum Speichern gefunden");
    }

    // Sende alle Benachrichtigungen (neue und existierende) als JSON-Response
    res.json({
      success: true,
      count: notifications.length,
      new: newNotifications.length,
      notifications: notifications,
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Benachrichtigungen:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Endpoint zum direkten Abrufen von Benachrichtigungen aus Firestore
app.get("/api/stored-notifications", async (req, res) => {
  try {
    const { getAllNotifications } = await import(
      "./service/firestoreService.js"
    );
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    console.log(`Lade bis zu ${limit} Benachrichtigungen aus Firestore...`);
    const notifications = await getAllNotifications(limit);
    console.log(
      `${notifications.length} Benachrichtigungen aus Firestore geladen.`
    );

    res.json({
      success: true,
      count: notifications.length,
      notifications: notifications,
    });
  } catch (err) {
    console.error(
      "Fehler beim Abrufen der gespeicherten Benachrichtigungen:",
      err.message
    );
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Füge einen Testendpoint hinzu
app.get("/api/test", (req, res) => {
  console.log("Testendpoint aufgerufen");
  res.json({
    success: true,
    message: "API funktioniert",
  });
});

// Starte den Server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server läuft auf http://localhost:${port}`);
  console.log(`Verfügbare Endpoints:`);
  console.log(`- GET /api/notifications - Bundesgesetzblätter Teil I abrufen`);
  console.log(
    `- GET /api/stored-notifications - Gespeicherte Benachrichtigungen aus Firestore abrufen`
  );
  console.log(`- GET /api/test - API-Test`);
});
