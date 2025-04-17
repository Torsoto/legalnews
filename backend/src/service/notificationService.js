import { ApiError } from '../middleware/errorHandler.js';
import BgblXmlParser from '../utils/xmlParser.js';
import { 
  summarizeWithGemini, 
  extractAffectedLawsWithAI, 
  extractLawsFromTitle,
  extractEffectiveDates
} from '../utils/aiService.js';
import {
  saveNotifications,
  notificationExists,
  getNotification,
  getAllNotifications
} from './firestoreService.js';
import fetch from 'node-fetch';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { Parser } from 'xml2js';

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
 * Fetch consolidated version URL for a law
 * @param {Object} law - Law details
 * @returns {Promise<string>} - URL to consolidated version
 */
async function fetchConsolidatedVersionUrl(law) {
  try {
    console.log(`Fetching consolidated version for ${law.title}`);
    
    // Create URL without using URLSearchParams to avoid additional encoding
    const baseUrl = "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht";
    
    // Manual construction of the URL to avoid encoding issues
    const encodedTitle = encodeURIComponent(law.title);
    const encodedOrgan = encodeURIComponent(law.publicationOrgan);
    const publicationNumber = encodeURIComponent(law.publicationNumber);
    
    // Fetch RSI to get consolidated law url
    const url = `${baseUrl}?Applikation=BrKons&Titel=${encodedTitle}&Kundmachungsorgan=${encodedOrgan}&Kundmachungsorgannummer=${publicationNumber}`;
    
    console.log("Sending request to RIS API for consolidated version:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    const brKons = data.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference?.[0]?.Data?.Metadaten?.Bundesrecht?.BrKons;
    
    // First try to get GesamteRechtsvorschriftUrl
    if (brKons?.GesamteRechtsvorschriftUrl) {
      const consolidatedUrl = brKons.GesamteRechtsvorschriftUrl;
      console.log(`Found consolidated version URL: ${consolidatedUrl}`);
      return consolidatedUrl;
    }
    
    // If GesamteRechtsvorschriftUrl is not available, try to use Gesetzesnummer
    if (brKons?.Gesetzesnummer) {
      const gesetzesnummer = brKons.Gesetzesnummer;
      const alternativeUrl = `https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=${gesetzesnummer}`;
      console.log(`No GesamteRechtsvorschriftUrl found, using Gesetzesnummer to build URL: ${alternativeUrl}`);
      return alternativeUrl;
    }
    
    // If neither is available, log the response and return null
    console.error("Neither GesamteRechtsvorschriftUrl nor Gesetzesnummer found in response");
    console.log("Full response:", JSON.stringify(data, null, 2));
    return null;
  } catch (error) {
    console.error("Error fetching consolidated version:", error);
    return null;
  }
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
      const documentTitle = metadata.Bundesrecht.Titel;
      const publicationDate = bgblInfo.Ausgabedatum;
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
            title: documentTitle,
            Ausgabedatum: publicationDate,
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
          Titel: documentTitle,
          Ausgabedatum: publicationDate,
        });

        // Set jurisdiction
        notification.jurisdiction = jurisdiction;

        // Generate text for AI analysis
        const fullText = `${notification.title}\n${notification.description}\n${
          notification.articles.length > 0 
            ? notification.articles.map((art) => `${art.title}\n${art.subtitle}`).join("\n")
            : notification.changes.map((change) => `${change.title}\n${change.change}`).join("\n")
        }`;

        // IMPROVED: First try to extract laws from title (more efficient)
        console.log(`Extracting affected laws from title for ${bgblNummer}: "${documentTitle}"`);
        let affectedLaws = await extractLawsFromTitle(documentTitle, bgblNummer, false);
        
        // If no laws found from title, fallback to AI extraction
        if (!affectedLaws || affectedLaws.length === 0) {
          console.log(`No laws found from title, falling back to AI extraction for ${bgblNummer}`);
          affectedLaws = await extractAffectedLawsWithAI(fullText, bgblNummer);
        }
        
        // Extract effective dates for affected laws
        if (affectedLaws && affectedLaws.length > 0) {
          console.log(`Extracting effective dates for ${affectedLaws.length} affected laws`);
          affectedLaws = await extractEffectiveDates(fullText, bgblNummer, publicationDate, affectedLaws);
          
          notification.affectedLaws = [];
          
          for (const law of affectedLaws) {
            // No need to fetch consolidated URL if it's already included
            if (!law.consolidatedVersionUrl) {
            console.log(`Fetching consolidated version for ${law.title}, ${law.publicationOrgan}, ${law.publicationNumber}`);
            const consolidatedUrl = await fetchConsolidatedVersionUrl(law);
              law.consolidatedVersionUrl = consolidatedUrl;
            }
            
            notification.affectedLaws.push({
              title: law.title,
              publicationOrgan: law.publicationOrgan,
              publicationNumber: law.publicationNumber,
              consolidatedVersionUrl: law.consolidatedVersionUrl,
              section: law.section || null,
              effectiveDate: law.effectiveDate || null
            });
          }
        } else {
          console.log(`No affected laws found for ${bgblNummer}`);
        }

        // Generate AI summary
        console.log(`Generating AI summary for ${bgblNummer}`);
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
 * Fetch consolidated version URL for a state law
 * @param {Object} law - Law details
 * @param {string} bundesland - State name
 * @returns {Promise<string>} - URL to consolidated version
 */
async function fetchStateConsolidatedVersionUrl(law, bundesland) {
  try {
    console.log(`Fetching consolidated version for ${law.title} (${bundesland})`);
    
    // Sanity check on inputs
    if (!law.title || !law.publicationNumber || !bundesland) {
      console.error('Missing required data for fetching state consolidated version', { law, bundesland });
      return null;
    }
    
    // Get the bundesland code for document URLs
    const bundeslandCode = getBundeslandCode(bundesland);
    if (!bundeslandCode) {
      console.error(`Unknown bundesland: ${bundesland}`);
      return null;
    }
    
    // Create URL without using URLSearchParams to avoid additional encoding
    const baseUrl = "https://data.bka.gv.at/ris/api/v2.6/Landesrecht";
    
    // Clean and encode the inputs
    const encodedTitle = encodeURIComponent(law.title.trim());
    const encodedOrgan = encodeURIComponent(law.publicationOrgan.trim());
    const encodedBundesland = encodeURIComponent(bundesland.trim());
    
    // Handle the publication number format - sometimes it comes with spaces
    let publicationNumber = law.publicationNumber.trim();
    if (!/^\d+\/\d{4}$/.test(publicationNumber)) {
      const match = publicationNumber.match(/(\d+)\s*\/\s*(\d{4})/);
      if (match) {
        publicationNumber = `${match[1]}/${match[2]}`;
      }
    }
    
    // Don't encode the publicationNumber as it should be used as is
    const url = `${baseUrl}?Applikation=LrKons&Titel=${encodedTitle}&Kundmachungsorgan=${encodedOrgan}&Kundmachungsorgannummer=${publicationNumber}&Bundesland=${encodedBundesland}`;
    
    console.log("Sending request to RIS API for state consolidated version:", url);
    
    try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
        timeout: 10000 // 10 second timeout
    });
    
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
      
      // Check if we have any results
      if (!data.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference?.[0]) {
        console.log(`No results found for ${law.title}`);
        
        // Try a second request with just the title and bundesland as fallback
        return await tryFallbackStateSearch(law.title, bundesland);
      }
      
      const lrKons = data.OgdSearchResult.OgdDocumentResults.OgdDocumentReference[0].Data?.Metadaten?.Landesrecht?.LrKons;
    
    // First try to get GesamteRechtsvorschriftUrl
    if (lrKons?.GesamteRechtsvorschriftUrl) {
      const consolidatedUrl = lrKons.GesamteRechtsvorschriftUrl;
      console.log(`Found state consolidated version URL: ${consolidatedUrl}`);
      return consolidatedUrl;
    }
    
    // If GesamteRechtsvorschriftUrl is not available, try to use Gesetzesnummer
    if (lrKons?.Gesetzesnummer) {
      const gesetzesnummer = lrKons.Gesetzesnummer;
        
        // Map the bundesland to the correct code for the Abfrage parameter
        const bundeslandCodeMapping = {
          'Wien': 'WI',
          'Niederösterreich': 'NI', 
          'Oberösterreich': 'OB',
          'Steiermark': 'ST',
          'Tirol': 'TI',
          'Kärnten': 'KI',
          'Salzburg': 'ST',
          'Vorarlberg': 'VO',
          'Burgenland': 'BU'
        };
        const urlCode = bundeslandCodeMapping[bundesland] || '';
        
        const alternativeUrl = `https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Lr${urlCode}&Gesetzesnummer=${gesetzesnummer}`;
      console.log(`No GesamteRechtsvorschriftUrl found, using Gesetzesnummer to build URL: ${alternativeUrl}`);
      return alternativeUrl;
    }
    
      // If neither is available, log the response and try fallback
      console.log("Neither GesamteRechtsvorschriftUrl nor Gesetzesnummer found in response, trying fallback search");
      return await tryFallbackStateSearch(law.title, bundesland);
      
    } catch (fetchError) {
      console.error("Fetch error for state consolidated version:", fetchError.message);
    return null;
    }
  } catch (error) {
    console.error("Error fetching state consolidated version:", error);
    return null;
  }
}

/**
 * Try a fallback search for a state law using just the title and bundesland
 * @param {string} title - Law title
 * @param {string} bundesland - State name
 * @returns {Promise<string>} - URL to consolidated version or null
 */
async function tryFallbackStateSearch(title, bundesland) {
  try {
    console.log(`Trying fallback search for ${title} in ${bundesland}`);
    
    // Clean title - keep only first few words
    const shortTitle = title.split(' ').slice(0, 4).join(' ');
    const encodedTitle = encodeURIComponent(shortTitle);
    const encodedBundesland = encodeURIComponent(bundesland);
    
    const fallbackUrl = `https://data.bka.gv.at/ris/api/v2.6/Landesrecht?Applikation=LrKons&Titel=${encodedTitle}&Bundesland=${encodedBundesland}`;
    
    console.log("Fallback search URL:", fallbackUrl);
    
    const response = await fetch(fallbackUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      timeout: 8000 // 8 second timeout
    });
    
    if (!response.ok) {
      console.error(`Fallback search HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if we have any results
    if (!data.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference?.[0]) {
      console.log(`No results found in fallback search for ${title}`);
      return null;
    }
    
    // Try to find a match among the results
    const references = data.OgdSearchResult.OgdDocumentResults.OgdDocumentReference;
    for (const ref of references) {
      const lrKons = ref.Data?.Metadaten?.Landesrecht?.LrKons;
      const foundTitle = ref.Data?.Metadaten?.Landesrecht?.Titel;
      
      // Compare titles
      if (foundTitle && title.toLowerCase().includes(foundTitle.toLowerCase()) || 
          foundTitle && foundTitle.toLowerCase().includes(title.toLowerCase().substring(0, 20))) {
        
        if (lrKons?.GesamteRechtsvorschriftUrl) {
          console.log(`Found matching law in fallback search: ${foundTitle}`);
          return lrKons.GesamteRechtsvorschriftUrl;
        }
        
        if (lrKons?.Gesetzesnummer) {
          const gesetzesnummer = lrKons.Gesetzesnummer;
          // Map the bundesland to the correct code for the URL
          const bundeslandCodeMapping = {
            'Wien': 'W',
            'Niederösterreich': 'NO', 
            'Oberösterreich': 'OO',
            'Steiermark': 'Stmk',
            'Tirol': 'T',
            'Kärnten': 'K',
            'Salzburg': 'S',
            'Vorarlberg': 'Vlbg',
            'Burgenland': 'Bgld'
          };
          const urlCode = bundeslandCodeMapping[bundesland] || '';
          
          const alternativeUrl = `https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Lr${urlCode}&Gesetzesnummer=${gesetzesnummer}`;
          console.log(`Using Gesetzesnummer from fallback search: ${alternativeUrl}`);
          return alternativeUrl;
        }
      }
    }
    
    console.log(`No suitable match found in fallback search for ${title}`);
    return null;
  } catch (error) {
    console.error("Error in fallback state search:", error);
    return null;
  }
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
      const bundeslandCode = getBundeslandCode(bundesland);
      const documentTitle = metadata.Landesrecht.Titel;
      const publicationDate = metadata.Landesrecht.Kundmachungsdatum;
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
            description: documentTitle,
            publicationDate: publicationDate,
            bundesland: bundesland,
            fromCache: true,
          });
        }
        continue;
      }

      // Create base notification object
      const notification = {
        id: lgblNummer,
        title: lgblNummer,
        description: documentTitle,
        publicationDate: publicationDate,
        bundesland: bundesland,
        jurisdiction: "LR",
        articles: [],
        changes: []
      };

      // For new state notifications, fetch and parse XML
      // Construct XML URL using the document ID pattern for LGBl
      const parts = lgblNummer.match(/LGBl\.\s+Nr\.\s+(\d+)\/(\d+)/i);
      let xmlUrl = '';
      
      if (parts) {
        const number = parts[1];
        const year = parts[2];
        
        // Get publication date in YYYYMMDD format, defaulting to today if not available
        const pubDate = metadata.Landesrecht.Kundmachungsdatum;
        let dateStr = '';
        
        if (pubDate) {
          try {
            // Parse the date and format it as YYYYMMDD
            const date = new Date(pubDate);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            dateStr = `${yyyy}${mm}${dd}`;
          } catch (e) {
            // If date parsing fails, use just the year
            dateStr = year;
          }
        } else {
          // If no date is available, use just the year
          dateStr = year;
        }
        
        // Construct the URL with the correct format: LGBLA_[BUNDESLAND-CODE]_[YYYYMMDD]_[NUMBER]
        xmlUrl = `https://www.ris.bka.gv.at/Dokumente/LgblAuth/LGBLA_${bundeslandCode}_${dateStr}_${number}/LGBLA_${bundeslandCode}_${dateStr}_${number}.xml`;
      } else {
        // Fallback format
        const cleanId = lgblNummer.replace(/\s+/g, '');
        xmlUrl = `https://www.ris.bka.gv.at/Dokumente/LgblAuth/${cleanId}/${cleanId}.xml`;
      }
      
      console.log(`State XML URL constructed: ${xmlUrl}`);
      
      // Fetch and parse XML
      const xmlResponse = await fetch(xmlUrl);
      if (xmlResponse.ok) {
        console.log(`XML for ${lgblNummer} successfully retrieved`);
        const xmlText = await xmlResponse.text();
        
        try {
          // Parse the XML with the correct metadata
          const parsedNotification = xmlParser.parse(xmlText, notification);
          Object.assign(notification, parsedNotification);
          
          // Ensure we have changes array even if none were found
          if (!notification.changes) {
            notification.changes = [];
          }
          
          console.log(`Successfully parsed XML for ${lgblNummer}, found ${notification.changes.length} changes`);
        } catch (parseErr) {
          console.error(`Error parsing state XML: ${parseErr.message}`);
          // Ensure we have empty arrays even on error
          notification.articles = notification.articles || [];
          notification.changes = notification.changes || [];
        }
        
        // Generate text for AI analysis from all available content
        const fullText = [
          notification.title,
          notification.description,
          ...(notification.articles || []).map(art => `${art.title}\n${art.subtitle || ''}`),
          ...(notification.changes || []).map(change => `${change.title}\n${change.change || ''}`)
        ].filter(Boolean).join('\n');
        
        console.log(`Extracted full text (${fullText.length} chars) for AI analysis of ${lgblNummer}`);
        
        // IMPROVED: First try to extract laws from title (more efficient)
        if (fullText.length > 0) {
          console.log(`Extracting affected laws from title for ${lgblNummer}: "${documentTitle}"`);
          let affectedLaws = await extractLawsFromTitle(documentTitle, lgblNummer, true);
          
          // If no laws found from title, fallback to AI extraction
          if (!affectedLaws || affectedLaws.length === 0) {
            console.log(`No laws found from title, falling back to AI extraction for ${lgblNummer}`);
            affectedLaws = await extractAffectedLawsWithAI(fullText, lgblNummer);
          }
          
          // Extract effective dates for affected laws
          if (affectedLaws && affectedLaws.length > 0) {
            console.log(`Extracting effective dates for ${affectedLaws.length} affected laws`);
            affectedLaws = await extractEffectiveDates(fullText, lgblNummer, publicationDate, affectedLaws);
            
            notification.affectedLaws = [];
            
            for (const law of affectedLaws) {
              // Set the publication organ with bundesland code
              const lawPublicationOrgan = `LGBl. ${bundeslandCode}`;
              
              // No need to fetch consolidated URL if it's already included
              if (!law.consolidatedVersionUrl) {
                console.log(`Fetching state consolidated version for ${law.title}, ${lawPublicationOrgan}, ${law.publicationNumber}, ${bundesland}`);
                const consolidatedUrl = await fetchStateConsolidatedVersionUrl(
                  {
                    ...law,
                    publicationOrgan: lawPublicationOrgan
                  }, 
                  bundesland
                );
                law.consolidatedVersionUrl = consolidatedUrl;
              }
              
              notification.affectedLaws.push({
                title: law.title,
                publicationOrgan: lawPublicationOrgan,
                publicationNumber: law.publicationNumber,
                consolidatedVersionUrl: law.consolidatedVersionUrl,
                section: law.section || null,
                effectiveDate: law.effectiveDate || null
              });
              
              console.log(`Added affected law: ${law.title} with URL: ${law.consolidatedVersionUrl || 'none'}`);
            }
          } else {
            console.log(`No affected laws found for state law ${lgblNummer} (${bundesland})`);
          }
        } else {
          console.warn(`Empty text for AI analysis of ${lgblNummer}, skipping affected laws extraction`);
        }
      } else {
        console.error(`Failed to fetch XML for ${lgblNummer}: ${xmlResponse.status} ${xmlResponse.statusText}`);
      }
      
      // Generate AI summary
      const { summary, category } = await summarizeWithGemini(notification.description || '');
      notification.aiSummary = summary;
      notification.category = category;
      
      // Add to the results
      notifications.push(notification);
      newNotifications.push(notification);
      console.log(`Processed state notification: ${lgblNummer}, has ${notification.affectedLaws?.length || 0} affected laws`);
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

/**
 * Helper function to get the code for a bundesland
 * @param {string} bundesland - Full name of the bundesland
 * @returns {string} - Code for the bundesland
 */
function getBundeslandCode(bundesland) {
  const codes = {
    'Wien': 'WI',
    'Niederösterreich': 'NI',
    'Oberösterreich': 'OB',
    'Steiermark': 'ST',
    'Tirol': 'TI',
    'Kärnten': 'KI',
    'Salzburg': 'SA',
    'Vorarlberg': 'VO',
    'Burgenland': 'BU'
  };
  
  return codes[bundesland] || '';
} 