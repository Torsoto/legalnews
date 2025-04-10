// xmlParser.js
import { XMLParser } from 'fast-xml-parser';

class BgblXmlParser {
    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
      removeNSPrefix: false,
      // Diese Einstellung beibehalten
            isArray: (name, jpath) => {
        return ['ueberschrift', 'absatz', 'liste', 'aufzaehlung', 'listelem'].includes(name);
            }
        });
    }

  // Extrahiert und trimmt den Textinhalt eines Elements
  processTextContent(element) {
    if (element['#text'] !== undefined && element['#text'] !== null) {
      // Falls '#text' nicht vom Typ String ist, konvertiere ihn
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

  // Verarbeitet Listenelemente (z. B. Aufzählungen)
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

  // Fügt Textteile sauber zusammen (ohne doppelte Leerzeilen)
  appendText(existing, addition) {
    if (!addition) return existing || "";
    if (existing && existing.trim().length > 0) {
      return existing.trim() + '\n' + addition.trim();
    }
    return addition.trim();
  }

  // Parst den XML-Text und baut anhand der übergebenen Metadaten das Notification-Objekt.
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
        changes: [],  // Changes are now at the notification level
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

  // Extract articles from the XML (just titles and subtitles)
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
  
  // Extract all changes from the document and add them to notification.changes
  extractChanges(abschnitt, notification) {
    // First try to extract changes from novao1/novao2 paragraphs
    this.extractChangesFromNovao(abschnitt, notification);
    
    // If no changes were found, try to extract them from numbered paragraphs
    if (notification.changes.length === 0) {
      this.extractChangesFromNumberedParagraphs(abschnitt, notification);
    }
  }
  
  // Extract changes from novao1/novao2 type paragraphs
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
      
      // Look for change instructions in novao paragraphs
      if (typ === 'novao1' || typ === 'novao2') {
        // Finish previous change
        if (currentChange) {
          notification.changes.push(currentChange);
        }
        
        // Start new change
        currentChange = {
          id: `change-${changeNumber++}`,
          instruction: text,
          newText: ''
        };
      } 
      // For paragraphs that follow novao, collect their content as newText
      else if ((typ === 'satz' || typ === 'abs') && currentChange) {
        currentChange.newText = this.appendText(currentChange.newText, text);
      }
    }
    
    // Add the last change if it exists
    if (currentChange) {
      notification.changes.push(currentChange);
    }
  }
  
  // Extract changes from numbered paragraphs (e.g. "1. Text...")
  extractChangesFromNumberedParagraphs(abschnitt, notification) {
    if (!abschnitt.absatz) return;
    
    const allParagraphs = Array.isArray(abschnitt.absatz) 
      ? abschnitt.absatz 
      : [abschnitt.absatz];
    
    let currentChange = null;
    let changeNumber = 1;
    
    for (const absatz of allParagraphs) {
      const text = this.processTextContent(absatz);
      
      // Check if paragraph starts with a number followed by dot or closing parenthesis
      const isNumberedParagraph = /^\d+[.)]/.test(text);
      
      if (isNumberedParagraph) {
        // Finish previous change
        if (currentChange) {
          notification.changes.push(currentChange);
        }
        
        // Start new change
        currentChange = {
          id: `change-${changeNumber++}`,
          instruction: text,
          newText: ''
        };
      } 
      // If this is not a numbered paragraph and we have a current change, add content to it
      else if (currentChange && text) {
        currentChange.newText = this.appendText(currentChange.newText, text);
      }
    }
    
    // Add the last change if it exists
    if (currentChange) {
      notification.changes.push(currentChange);
    }
  }
  
  // Process content from tables (used for certain BGBl formats)
  processTableContent(table, notification) {
    if (!table) return;
    
    const rows = table.tr;
    if (!rows) return;
    
    const tableRows = Array.isArray(rows) ? rows : [rows];
    
    for (const row of tableRows) {
      const cells = row.td;
      if (!cells) continue;
      
      const tableCells = Array.isArray(cells) ? cells : [cells];
      
      // Extract text from cells
      for (const cell of tableCells) {
        // Process cell content - could be complex with nested elements
        const cellText = this.processTextContent(cell);
        if (cellText.trim()) {
          // Depending on content pattern, we might add it to articles or changes
          // This is a simplified approach - may need customization based on actual data
                }
            }
        }
    }
}

export default BgblXmlParser;