import { ApiError } from '../middleware/errorHandler.js';
import BgblXmlParser from '../utils/xmlParser.js';
import { summarizeWithGemini } from '../utils/aiService.js';
import {
  saveNotifications,
  notificationExists,
  getNotification,
  getAllNotifications
} from '../service/firestoreService.js';
import fetch from 'node-fetch';

/**
 * Fetch and process the latest legal notifications
 */
export const getLatestNotifications = async (req, res, next) => {
  try {
    console.log("Processing request for latest notifications");

    const baseUrl = "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht";
    const params = new URLSearchParams({
      Applikation: "BgblAuth",
      "Teil.SucheInTeil1": "true",
      "Typ.SucheInGesetzen": "true",
      "Kundmachung.Periode": "EinemMonat",
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log("Sending request to RIS API:", url);

    // Fetch from RIS API
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new ApiError(`HTTP Error: ${response.status} ${response.statusText}`, 502);
    }

    const data = await response.json();
    console.log("RIS API response received");

    if (!data.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference) {
      throw new ApiError("No documents found in RIS response", 404);
    }

    const results = data.OgdSearchResult.OgdDocumentResults.OgdDocumentReference;
    console.log(`${results.length} documents found`);

    const notifications = [];
    const newNotifications = [];
    const xmlParser = new BgblXmlParser();

    // Process each document
    for (const doc of results) {
      try {
        const metadata = doc.Data.Metadaten;
        const bgblInfo = metadata.Bundesrecht.BgblAuth;
        const bgblNummer = bgblInfo.Bgblnummer;
        console.log(`Processing: ${bgblNummer}`);

        // Check if notification already exists in Firestore
        const exists = await notificationExists(bgblNummer);

        if (exists) {
          console.log(`Notification ${bgblNummer} already exists in Firestore, loading from database.`);
          const existingNotification = await getNotification(bgblNummer);

          if (existingNotification) {
            notifications.push({
              ...existingNotification,
              fromCache: true,
            });
          } else {
            notifications.push({
              id: bgblNummer,
              Bgblnummer: bgblNummer,
              title: metadata.Bundesrecht.Titel,
              Ausgabedatum: bgblInfo.Ausgabedatum,
              fromCache: true,
            });
          }
          continue;
        }

        console.log(`New notification ${bgblNummer} found, processing XML...`);
        const mainDoc = doc.Data.Dokumentliste?.ContentReference;
        if (mainDoc?.Urls?.ContentUrl) {
          const contentUrls = Array.isArray(mainDoc.Urls.ContentUrl)
            ? mainDoc.Urls.ContentUrl
            : [mainDoc.Urls.ContentUrl];

          const xmlUrl = contentUrls.find((url) => url.DataType === "Xml")?.Url;

          if (xmlUrl) {
            console.log(`XML URL found: ${xmlUrl}`);
            const xmlResponse = await fetch(xmlUrl);
            if (xmlResponse.ok) {
              console.log(`XML for ${bgblNummer} successfully retrieved`);
              const xmlText = await xmlResponse.text();

              const notification = xmlParser.parse(xmlText, {
                id: bgblNummer,
                Bgblnummer: bgblNummer,
                Titel: metadata.Bundesrecht.Titel,
                Ausgabedatum: bgblInfo.Ausgabedatum,
              });

              // Generate AI summary
              console.log(`Generating AI summary for ${bgblNummer}`);
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
        console.error(`Error processing document: ${docErr.message}`);
      }
    }

    // Save new notifications to Firestore
    if (newNotifications.length > 0) {
      try {
        await saveNotifications(newNotifications);
        console.log(`${newNotifications.length} new notifications successfully saved to Firestore`);
      } catch (firestoreErr) {
        console.error("Error saving to Firestore:", firestoreErr.message);
      }
    } else {
      console.log("No new notifications found to save");
    }

    // Send response
    res.json({
      success: true,
      count: notifications.length,
      new: newNotifications.length,
      notifications: notifications,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch stored notifications from Firestore
 */
export const getStoredNotifications = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    console.log(`Loading up to ${limit} notifications from Firestore...`);
    const notifications = await getAllNotifications(limit);
    console.log(`${notifications.length} notifications loaded from Firestore.`);

    res.json({
      success: true,
      count: notifications.length,
      notifications: notifications,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Test endpoint
 */
export const testEndpoint = (req, res) => {
  console.log("Test endpoint called");
  res.json({
    success: true,
    message: "API is working",
  });
}; 