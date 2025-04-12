import { XMLParser } from 'fast-xml-parser';

/**
 * Parser for BGBl XML documents from Austrian RIS API
 */
class BgblXmlParser {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      removeNSPrefix: false,
      isArray: (name) => {
        return ['ueberschrift', 'absatz', 'liste', 'aufzaehlung', 'listelem'].includes(name);
      }
    });
  }

  /**
   * Extracts and trims the text content of an element
   * @param {Object|string} element - The element to process
   * @returns {string} - The processed text content
   */
  processTextContent(element) {
    if (element['#text'] !== undefined && element['#text'] !== null) {
      // Convert to string if necessary
      if (typeof element['#text'] !== 'string') {
        return String(element['#text']).trim();
      }
      return element['#text'].trim();
    }
    if (typeof element === 'string') {
      return element.trim();
    }
    return '';
  }

  /**
   * Processes list content
   * @param {Object|Array} list - The list to process
   * @returns {string} - The processed list text
   */
  processListContent(list) {
    if (!list) return '';
    let text = '';
    if (Array.isArray(list)) {
      list.forEach(item => {
        if (item.listelem) {
          const listItems = Array.isArray(item.listelem) ? item.listelem : [item.listelem];
          listItems.forEach(listItem => {
            if (listItem['#text']) {
              text += listItem['#text'].trim() + '\n';
            }
          });
        }
      });
    }
    return text.trim();
  }

  /**
   * Appends text safely
   * @param {string} existing - Existing text
   * @param {string} addition - Text to append
   * @returns {string} - Combined text
   */
  appendText(existing, addition) {
    if (!addition) return existing || "";
    if (existing && existing.trim().length > 0) {
      return existing.trim() + '\n' + addition.trim();
    }
    return addition.trim();
  }

  /**
   * Parses XML text into a structured notification object
   * @param {string} xmlText - The XML text to parse
   * @param {Object} metadata - Document metadata
   * @returns {Object} - Parsed notification object
   */
  parse(xmlText, metadata) {
    try {
      const xmlData = this.parser.parse(xmlText);
      const notification = {
        id: metadata.Bgblnummer,
        title: metadata.Bgblnummer,
        description: metadata.Titel,
        publicationDate: metadata.Ausgabedatum,
        isRead: false,
        articles: [],
        changes: [],
        category: "Bundesrecht",
        jurisdiction: "BR"
      };

      // Get the main content section
      const abschnitt = xmlData['risdok'] &&
                        xmlData['risdok']['nutzdaten'] &&
                        xmlData['risdok']['nutzdaten']['abschnitt'];
      
      if (!abschnitt) {
        console.error(`[${metadata.Bgblnummer}] No abschnitt found in XML`);
        notification.articles.push({
          id: 'art-1',
          title: 'Keine Inhalte gefunden',
          subtitle: ''
        });
        return notification;
      }

      // Extract articles (titles and subtitles)
      this.extractArticles(abschnitt, notification);
      
      // Extract all changes
      this.extractChanges(abschnitt, notification);
      
      // If no articles were found, create a default one
      if (notification.articles.length === 0) {
        console.warn(`[${metadata.Bgblnummer}] No articles extracted, creating default article`);
        notification.articles.push({
          id: 'art-1',
          title: 'Änderungen',
          subtitle: metadata.Titel
        });
      }

      return notification;
    } catch (error) {
      console.error(`[${metadata.Bgblnummer}] Error parsing XML: ${error.message}`);
      return {
        id: metadata.Bgblnummer,
        title: `${metadata.Bgblnummer} (Parse Error)`,
        description: `Error parsing XML: ${error.message}`,
        publicationDate: metadata.Ausgabedatum,
        isRead: false,
        articles: [{
          id: 'art-error',
          title: 'Error',
          subtitle: 'Failed to parse document'
        }],
        changes: [],
        category: "Bundesrecht",
        jurisdiction: "BR",
        error: true
      };
    }
  }

  /**
   * Extract articles from the XML (just titles and subtitles)
   * @param {Object} abschnitt - The XML section to extract from
   * @param {Object} notification - The notification object to update
   */
  extractArticles(abschnitt, notification) {
    if (!abschnitt.ueberschrift) return;
    
    const allHeaders = Array.isArray(abschnitt.ueberschrift) 
      ? abschnitt.ueberschrift 
      : [abschnitt.ueberschrift];
    
    let articleTitles = [];
    
    // First pass - identify article titles (g1 headers)
    for (let i = 0; i < allHeaders.length; i++) {
      const header = allHeaders[i];
      const typ = header['@_typ'] || '';
      const text = this.processTextContent(header);
      
      if (typ === 'g1') {
        articleTitles.push({
          title: text,
          subtitle: '',
          index: i
        });
      }
    }
    
    // Second pass - identify subtitles (g2 headers that follow g1)
    for (let i = 0; i < articleTitles.length; i++) {
      const title = articleTitles[i];
      const headerIndex = title.index;
      
      if (headerIndex + 1 < allHeaders.length && 
          allHeaders[headerIndex + 1]['@_typ'] === 'g2') {
        title.subtitle = this.processTextContent(allHeaders[headerIndex + 1]);
      }
    }
    
    // Create article objects
    articleTitles.forEach((title, index) => {
      notification.articles.push({
        id: `art-${index + 1}`,
        title: title.title,
        subtitle: title.subtitle
      });
    });
  }
  
  /**
   * Extract all changes from the document
   * @param {Object} abschnitt - The section to extract changes from
   * @param {Object} notification - The notification object to update
   */
  extractChanges(abschnitt, notification) {
    // First try to extract changes from novao1/novao2 paragraphs
    this.extractChangesFromNovao(abschnitt, notification);
    
    // If no changes were found, try to extract them from numbered paragraphs
    if (notification.changes.length === 0) {
      this.extractChangesFromNumberedParagraphs(abschnitt, notification);
    }
  }
  
  /**
   * Extract changes from novao1/novao2 type paragraphs
   * @param {Object} abschnitt - The section to extract from
   * @param {Object} notification - The notification object to update
   */
  extractChangesFromNovao(abschnitt, notification) {
    if (!abschnitt.absatz) return;
    
    const allParagraphs = Array.isArray(abschnitt.absatz) 
      ? abschnitt.absatz 
      : [abschnitt.absatz];
    
    let currentChange = null;
    let changeNumber = 1;
    
    for (const absatz of allParagraphs) {
      const typ = absatz['@_typ'] || '';
      const text = this.processTextContent(absatz);
      
      // Process tables
      if (absatz.table) {
        this.processTableContent(absatz.table, notification);
        continue;
      }
      
      // Process change paragraphs
      if (typ === 'novao1' || typ === 'nova1') {
        // This is a main change item number
        currentChange = {
          id: `change-${changeNumber++}`,
          number: text,
          title: '',
          details: []
        };
        notification.changes.push(currentChange);
      } else if ((typ === 'novao2' || typ === 'nova2') && currentChange) {
        // This is the title/description of the change
        currentChange.title = text;
      } else if (currentChange && text) {
        // This is a detail paragraph of the change
        currentChange.details.push(text);
      }
    }
  }

  /**
   * Extract changes from numbered paragraphs
   * @param {Object} abschnitt - The section to extract from
   * @param {Object} notification - The notification object to update
   */
  extractChangesFromNumberedParagraphs(abschnitt, notification) {
    if (!abschnitt.absatz) return;
    
    const allParagraphs = Array.isArray(abschnitt.absatz) 
      ? abschnitt.absatz 
      : [abschnitt.absatz];
    
    const numberedPattern = /^\d+\.\s/;
    let currentChange = null;
    let changeNumber = 1;
    
    for (const absatz of allParagraphs) {
      const text = this.processTextContent(absatz);
      
      // Skip empty paragraphs
      if (!text) continue;
      
      // Process tables
      if (absatz.table) {
        this.processTableContent(absatz.table, notification);
        continue;
      }
      
      // Check if this is a numbered paragraph
      if (numberedPattern.test(text)) {
        // This is a main change item
        currentChange = {
          id: `change-${changeNumber++}`,
          number: text.split('.')[0],
          title: text.substring(text.indexOf('.') + 1).trim(),
          details: []
        };
        notification.changes.push(currentChange);
      } else if (currentChange && text) {
        // This is a detail paragraph of the current change
        currentChange.details.push(text);
      }
    }
  }

  /**
   * Process table content
   * @param {Object} table - The table to process
   * @param {Object} notification - The notification object to update
   */
  processTableContent(table, notification) {
    // Table processing implementation would go here
    // This is a simplified version and may need to be expanded
    if (!table) return;
    
    // For now, we just add a note about table content
    notification.changes.push({
      id: `change-table-${notification.changes.length + 1}`,
      number: "T",
      title: "Tabelle im Dokument",
      details: ["Das Dokument enthält eine Tabelle, die in dieser Ansicht nicht vollständig dargestellt werden kann."]
    });
  }
}

export default BgblXmlParser; 