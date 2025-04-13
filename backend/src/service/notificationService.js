import { ApiError } from '../middleware/errorHandler.js';
import BgblXmlParser from '../utils/xmlParser.js';
import { summarizeWithGemini } from '../utils/aiService.js';
import {
  saveNotifications,
  notificationExists,
  getNotification,
  getAllNotifications
} from './firestoreService.js';
import fetch from 'node-fetch';

/**
 * Fetch latest notifications from the Federal Law API
 * @returns {Promise<Object>} - Object containing notifications and metadata
 */
export async function fetchLatestNotifications() {
  console.log("Fetching latest notifications");

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

  return await processNotifications(data.OgdSearchResult.OgdDocumentResults.OgdDocumentReference, "BR");
}

/**
 * Fetch latest state law notifications
 * @returns {Promise<Object>} - Object containing notifications and metadata 
 */
export async function fetchStateNotifications() {
  console.log("Fetching latest state notifications");

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

  return await processStateNotifications(data.OgdSearchResult.OgdDocumentResults.OgdDocumentReference);
}

/**
 * Process notifications from API results
 * @param {Array} results - Array of document references
 * @param {string} jurisdiction - Jurisdiction code (BR, LR, EU)
 * @returns {Promise<Object>} - Processed notifications and metadata
 */
async function processNotifications(results, jurisdiction) {
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
        notification.jurisdiction = jurisdiction;

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

  return {
    count: notifications.length,
    new: newNotifications.length,
    notifications: notifications,
  };
}

/**
 * Process state notifications from API results
 * @param {Array} results - Array of document references
 * @returns {Promise<Object>} - Processed notifications and metadata
 */
async function processStateNotifications(results) {
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

      // Process XML similarly to federal notifications
      // (Implementation would be similar to federal, adapted for state format)
      // This is a simplified version - full implementation would include XML parsing 
      
      const notification = {
        id: lgblNummer,
        title: lgblNummer,
        description: metadata.Landesrecht.Titel,
        publicationDate: metadata.Landesrecht.Kundmachungsdatum,
        bundesland: bundesland,
        jurisdiction: "LR"
      };
      
      // Generate AI summary if needed
      const { summary, category } = await summarizeWithGemini(notification.description);
      notification.aiSummary = summary;
      notification.category = category;
      
      notifications.push(notification);
      newNotifications.push(notification);
    } catch (docErr) {
      console.error(`Error processing state document: ${docErr.message}`);
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
  }

  return {
    count: notifications.length,
    new: newNotifications.length,
    notifications: notifications,
  };
}

/**
 * Get stored notifications from Firestore
 * @param {number} limit - Maximum number of notifications to retrieve
 * @returns {Promise<Array>} - Array of notifications
 */
export async function getStoredNotifications(limit = 50) {
  return await getAllNotifications(limit);
} 