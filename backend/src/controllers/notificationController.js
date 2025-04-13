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
        
        // Fix URL format: Extract parts and use BGBLA_YEAR_TYPE_NUMBER format
        const parts = bgblNummer.match(/BGBl\.\s+(\w+)\s+Nr\.\s+(\d+)\/(\d+)/i);
        let xmlUrl = '';
        
        if (parts) {
          const type = parts[1]; // I or II
          const number = parts[2];
          const year = parts[3];
          xmlUrl = `https://www.ris.bka.gv.at/Dokumente/BgblAuth/BGBLA_${year}_${type}_${number}/BGBLA_${year}_${type}_${number}.xml`;
        } else {
          // Fallback to direct format if pattern doesn't match
          const cleanId = bgblNummer.replace(/\s+/g, '');
          xmlUrl = `https://www.ris.bka.gv.at/Dokumente/BgblAuth/${cleanId}/${cleanId}.xml`;
        }
        
        console.log(`XML URL constructed: ${xmlUrl}`);
        
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

          // Set jurisdiction
          notification.jurisdiction = "BR";

          // Generate AI summary
          console.log(`Generating AI summary for ${bgblNummer}`);
          const fullText = `${notification.title}\n${notification.description}\n${
            notification.articles.length > 0 
              ? notification.articles.map((art) => `${art.title}\n${art.subtitle}`).join("\n")
              : notification.changes.map((change) => `${change.title}\n${change.change}`).join("\n")
          }`;
          
          const { summary, category } = await summarizeWithGemini(fullText);
          notification.aiSummary = summary;
          notification.category = category;

          notifications.push(notification);
          newNotifications.push(notification);
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
 * Fetch and process the latest state law notifications
 */
export const getStateNotifications = async (req, res, next) => {
  try {
    console.log("Processing request for latest state notifications");

    const baseUrl = "https://data.bka.gv.at/ris/api/v2.6/Landesrecht";
    const params = new URLSearchParams({
      Applikation: "LgblAuth",
      "Teil.SucheInTeil1": "true",
      "Typ.SucheInGesetzen": "true",
      "Kundmachung.Periode": "ZweiWochen",
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
    console.log(`${results.length} state law documents found`);

    const notifications = [];
    const newNotifications = [];
    const xmlParser = new BgblXmlParser();

    // Process each document
    for (const doc of results) {
      try {
        const metadata = doc.Data.Metadaten;
        const lgblInfo = metadata.Landesrecht.LgblAuth;
        const lgblNummer = lgblInfo.Lgblnummer;
        const bundesland = metadata.Landesrecht.Bundesland;
        console.log(`Processing state law: ${lgblNummer} (${bundesland})`);

        // Check if notification already exists in Firestore
        const exists = await notificationExists(lgblNummer);

        if (exists) {
          console.log(`Notification ${lgblNummer} already exists in Firestore, loading from database.`);
          const existingNotification = await getNotification(lgblNummer);

          if (existingNotification) {
            notifications.push({
              ...existingNotification,
              fromCache: true,
            });
          } else {
            notifications.push({
              id: lgblNummer,
              title: lgblNummer,
              description: metadata.Landesrecht.Titel,
              publicationDate: metadata.Landesrecht.Kundmachungsdatum,
              bundesland: bundesland,
              fromCache: true,
            });
          }
          continue;
        }

        console.log(`New state notification ${lgblNummer} found, processing XML...`);
        
        // Construct XML URL based on document ID format
        const docId = metadata.Technisch.ID;
        const xmlUrl = `https://www.ris.bka.gv.at/Dokumente/LgblAuth/${docId}/${docId}.xml`;
        
        console.log(`XML URL constructed: ${xmlUrl}`);
        
        const xmlResponse = await fetch(xmlUrl);
        if (xmlResponse.ok) {
          console.log(`XML for ${lgblNummer} successfully retrieved`);
          const xmlText = await xmlResponse.text();

          const notification = xmlParser.parse(xmlText, {
            id: lgblNummer,
            Bgblnummer: lgblNummer,
            Titel: metadata.Landesrecht.Titel,
            Ausgabedatum: metadata.Landesrecht.Kundmachungsdatum,
            Bundesland: bundesland
          });

          // Set jurisdiction
          notification.jurisdiction = "LR";
          notification.bundesland = bundesland;

          // Generate AI summary
          console.log(`Generating AI summary for ${lgblNummer}`);
          const fullText = `${notification.title}\n${notification.description}\n${bundesland}\n${
            notification.articles.length > 0 
              ? notification.articles.map((art) => `${art.title}\n${art.subtitle}`).join("\n")
              : notification.changes.map((change) => `${change.title}\n${change.change}`).join("\n")
          }`;
          
          const { summary, category } = await summarizeWithGemini(fullText);
          notification.aiSummary = summary;
          notification.category = category;

          notifications.push(notification);
          newNotifications.push(notification);
        }
      } catch (docErr) {
        console.error(`Error processing document: ${docErr.message}`);
      }
    }

    // Save new notifications to Firestore
    if (newNotifications.length > 0) {
      try {
        await saveNotifications(newNotifications);
        console.log(`${newNotifications.length} new state notifications successfully saved to Firestore`);
      } catch (firestoreErr) {
        console.error("Error saving to Firestore:", firestoreErr.message);
      }
    } else {
      console.log("No new state notifications found to save");
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
    const jurisdictionFilter = req.query.jurisdiction || null;

    console.log(`Loading up to ${limit} notifications from Firestore...`);
    let notifications = await getAllNotifications(limit);
    
    // Apply jurisdiction filter if specified
    if (jurisdictionFilter) {
      notifications = notifications.filter(notification => 
        notification.jurisdiction === jurisdictionFilter
      );
      console.log(`Filtered to ${notifications.length} ${jurisdictionFilter} notifications`);
    }
    
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