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
        return ['ueberschrift', 'absatz', 'liste', 'aufzaehlung', 'listelem', 'inhaltsvz', 'table', 'tr', 'td', 'n'].includes(name);
      }
    });
  }

  /**
   * Extracts and trims the text content of an element
   * @param {Object|string} element - The element to process
   * @returns {string} - The processed text content
   */
  processTextContent(element) {
    // Handle simple text content
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
    
    // Handle elements with nested <n> tags
    if (element.n) {
      const mainText = element['#text'] || '';
      const nElements = Array.isArray(element.n) ? element.n : [element.n];
      
      // Reconstruct the text with <n> elements inline
      let fullText = mainText;
      
      for (const n of nElements) {
        const nText = this.processTextContent(n);
        if (nText) {
          fullText += ' "' + nText + '" ';
        }
      }
      
      return fullText.replace(/\s+/g, ' ').trim();
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
      
      // Initialize notification with correct metadata based on whether it's a state or federal notification
      const isStateNotification = metadata.id?.includes('LGBl.') || metadata.bundesland;
      
      const notification = {
        id: metadata.id || metadata.Bgblnummer,
        title: isStateNotification ? metadata.title || metadata.id : metadata.Bgblnummer,
        description: isStateNotification ? metadata.description : metadata.Titel,
        publicationDate: isStateNotification ? metadata.publicationDate : metadata.Ausgabedatum,
        isRead: false,
        articles: [],
        changes: [],
        category: isStateNotification ? "Landesrecht" : "Bundesrecht",
        jurisdiction: isStateNotification ? "LR" : "BR"
      };
      
      // Add bundesland if it exists
      if (metadata.bundesland) {
        notification.bundesland = metadata.bundesland;
      }

      // Get the main content section
      const abschnitt = xmlData['risdok'] &&
                        xmlData['risdok']['nutzdaten'] &&
                        xmlData['risdok']['nutzdaten']['abschnitt'];
      
      if (!abschnitt) {
        console.error(`[${notification.id}] No abschnitt found in XML`);
        return notification;
      }

      // Extract articles (titles and subtitles) if they exist
      if (abschnitt.ueberschrift) {
        this.extractArticles(abschnitt, notification);
      }
      
      // Extract all changes
      this.extractChanges(xmlData, notification);

      // Log for debugging
      console.log(`Extracted ${notification.articles.length} articles and ${notification.changes.length} changes for ${notification.id}`);

      return notification;
    } catch (error) {
      console.error(`[${metadata.id || metadata.Bgblnummer}] Error parsing XML: ${error.message}`);
      
      // Create error notification with appropriate metadata
      const isStateNotification = metadata.id?.includes('LGBl.') || metadata.bundesland;
      
      return {
        id: metadata.id || metadata.Bgblnummer,
        title: `${isStateNotification ? metadata.id : metadata.Bgblnummer} (Parse Error)`,
        description: `Error parsing XML: ${error.message}`,
        publicationDate: isStateNotification ? metadata.publicationDate : metadata.Ausgabedatum,
        isRead: false,
        articles: [],
        changes: [],
        category: isStateNotification ? "Landesrecht" : "Bundesrecht",
        jurisdiction: isStateNotification ? "LR" : "BR",
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
    
    // First pass - identify actual article titles 
    // These should contain "Artikel" or similar patterns
    for (let i = 0; i < allHeaders.length; i++) {
      const header = allHeaders[i];
      const typ = header['@_typ'] || '';
      const text = this.processTextContent(header);
      
      // Check if this is a g1 header AND matches article pattern
      if (typ === 'g1' && (
          /^artikel\s+\d+/i.test(text) || // "Artikel 1", etc.
          /^art\.\s+\d+/i.test(text)    // "Art. 1", etc.
        )) {
        articleTitles.push({
          title: text,
          subtitle: '',
          index: i
        });
      }
    }
    
    // If no actual articles were found, return early
    if (articleTitles.length === 0) {
      return;
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
   * Processes an absatz element with nested <n> tags
   * @param {Object} absatz - The absatz element to process
   * @returns {string} - The processed text
   */
  processAbsatzWithN(absatz) {
    if (!absatz || !absatz.n) return '';
    
    // Get the main text and all <n> elements
    let mainText = absatz['#text'] || '';
    const nElements = Array.isArray(absatz.n) ? absatz.n : [absatz.n];
    
    // Clean up the main text
    mainText = mainText.replace(/\n/g, ' ').trim();
    
    // Process each <n> element and add its content to the text
    for (let i = 0; i < nElements.length; i++) {
      const nText = this.processTextContent(nElements[i]);
      if (nText) {
        // Find the position in the main text where this <n> appears
        if (i === 0 && mainText.includes('die Wendung')) {
          mainText = mainText.replace('die Wendung', `die Wendung "` + nText + `"`);
        } else if (i === 1 && mainText.includes('das Wort')) {
          mainText = mainText.replace('das Wort', `das Wort "` + nText + `"`);
        } else if (i === 2 && mainText.includes('die Wendung')) {
          mainText = mainText.replace(/die Wendung(?!.*die Wendung)/, `die Wendung "` + nText + `"`);
        } else {
          // Generic fallback if specific patterns aren't found
          mainText += ` "` + nText + `"`;
        }
      }
    }
    
    return mainText.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Processes a zitat element and its content
   * @param {Object} zitat - The zitat to process
   * @returns {string} - The processed text
   */
  processZitatContent(zitat) {
    if (!zitat) return '';
    
    // First get the direct text content
    let content = this.processTextContent(zitat);
    
    // Handle nested absatz elements within zitat
    if (zitat.absatz) {
      const absatzArray = Array.isArray(zitat.absatz) ? zitat.absatz : [zitat.absatz];
      for (const absatz of absatzArray) {
        const absatzText = this.processTextContent(absatz);
        if (absatzText) {
          content += '\n' + absatzText;
        }
      }
    }
    
    return content;
  }
  
  /**
   * Extract all changes from the document
   * @param {Object} xmlData - The complete XML data
   * @param {Object} notification - The notification object to update
   */
  extractChanges(xmlData, notification) {
    const nutzdaten = xmlData['risdok'] && xmlData['risdok']['nutzdaten'];
    if (!nutzdaten) return;
    
    // First extract all content in order
    const allContent = [];
    this.extractContent(nutzdaten, allContent);
    
    // Then find all nova elements
    let allChanges = [];
    this.findNovaElements(nutzdaten, allChanges);
    
    // Process all changes
    let changeNumber = 1;
    
    for (let i = 0; i < allChanges.length; i++) {
      const change = allChanges[i];
      const isLastChange = i === allChanges.length - 1;
      
      if (change.type === 'novao1' || change.type === 'nova1') {
        // Look for content between this change and the next one
        const changeIndex = allContent.findIndex(item => 
          item.type === 'absatz' && 
          (item.subtype === 'novao1' || item.subtype === 'nova1' || 
           item.subtype === 'novao2' || item.subtype === 'nova2') && 
          item.text === change.text
        );
        
        let contentItems = [];
        
        if (changeIndex !== -1) {
          // Find the next change in allContent
          let nextChangeIndex = -1;
          
          for (let j = changeIndex + 1; j < allContent.length; j++) {
            const item = allContent[j];
            if (item.type === 'absatz' && 
               (item.subtype === 'novao1' || item.subtype === 'nova1' || 
                item.subtype === 'novao2' || item.subtype === 'nova2')) {
              nextChangeIndex = j;
              break;
            }
          }
          
          // Collect all content between this change and the next
          const endIndex = nextChangeIndex !== -1 ? nextChangeIndex : allContent.length;
          
          for (let j = changeIndex + 1; j < endIndex; j++) {
            const item = allContent[j];
            if (item.text) {
              contentItems.push(item.text);
            }
          }
        }
        
        // Also check for zitat in the element
        if (change.element && change.element.zitat) {
          const zitatText = this.processZitatContent(change.element.zitat);
          if (zitatText) {
            contentItems.push(zitatText);
          }
        }
        
        // Add it as a change with its content
        notification.changes.push({
          id: `change-${changeNumber++}`,
          title: change.text,
          change: contentItems.join('\n')
        });
      } 
      else if (change.type === 'novao2' || change.type === 'nova2') {
        // For novao2, look for any following content
        let contentItems = [];
        
        // Check if this novao2 is followed by content like a zitat
        if (change.element && change.element.zitat) {
          const zitatText = this.processZitatContent(change.element.zitat);
          if (zitatText) {
            contentItems.push(zitatText);
          }
        }
        
        // Also check if this is the last change before a specific content section
        if (!isLastChange) {
          const nextChange = allChanges[i + 1];
          
          // Look for content between this change and the next
          const changeIndex = allContent.findIndex(item => 
            item.type === 'absatz' && 
            (item.subtype === 'novao2' || item.subtype === 'nova2') && 
            item.text === change.text
          );
          
          if (changeIndex !== -1) {
            const nextChangeIndex = allContent.findIndex(item => 
              item.type === 'absatz' && 
              ((item.subtype === 'novao1' && nextChange.type === 'novao1') || 
               (item.subtype === 'nova1' && nextChange.type === 'nova1') ||
               (item.subtype === 'novao2' && nextChange.type === 'novao2') ||
               (item.subtype === 'nova2' && nextChange.type === 'nova2')) && 
              item.text === nextChange.text
            );
            
            if (nextChangeIndex !== -1 && nextChangeIndex > changeIndex) {
              // There's content between this change and the next
              for (let j = changeIndex + 1; j < nextChangeIndex; j++) {
                const item = allContent[j];
                if (item.text && item.type !== 'absatz') {
                  contentItems.push(item.text);
                }
              }
            }
          }
        }
        
        notification.changes.push({
          id: `change-${changeNumber++}`,
          title: change.text,
          change: contentItems.join('\n')
        });
      }
    }
  }
  
  /**
   * Find all novao/nova elements in the XML
   * @param {Object} element - The element to search in
   * @param {Array} changes - Array to collect found changes
   */
  findNovaElements(element, changes) {
    if (!element) return;
    
    // Check if this element is an absatz with novao/nova type
    if (element.absatz) {
      const absatzArray = Array.isArray(element.absatz) ? element.absatz : [element.absatz];
      
      for (const absatz of absatzArray) {
        const typ = absatz['@_typ'] || '';
        
        if (typ === 'novao1' || typ === 'nova1') {
          // Standard novao1 handling
          changes.push({
            type: typ,
            text: this.processTextContent(absatz),
            element: absatz  // Store the original element for later
          });
        } 
        else if ((typ === 'novao2' || typ === 'nova2') && absatz.n) {
          // Special handling for novao2 with nested <n> tags
          changes.push({
            type: typ,
            text: this.processAbsatzWithN(absatz),
            element: absatz
          });
        }
        else if (typ === 'novao2' || typ === 'nova2') {
          // Standard novao2 handling
          changes.push({
            type: typ,
            text: this.processTextContent(absatz),
            element: absatz
          });
        }
        
        // Recursively search in nested elements
        this.findNovaElements(absatz, changes);
      }
    }
    
    // Search in other types of elements
    for (const key in element) {
      if (element[key] && typeof element[key] === 'object') {
        this.findNovaElements(element[key], changes);
      }
    }
  }

  /**
   * Extract content that follows a novao1 element
   * @param {Object} novao - The novao1 element
   * @returns {string} - The extracted content
   */
  extractNovaContent(novao) {
    // This is a simplified approach - in a full implementation,
    // you would need to extract all content that follows this novao1
    // until the next novao1/novao2/nova1/nova2.
    let content = [];
    
    // Check for common content patterns
    if (novao.zitat) {
      content.push(this.processTextContent(novao.zitat));
    }
    
    if (novao.absatz && Array.isArray(novao.absatz)) {
      novao.absatz.slice(1).forEach(abs => {
        content.push(this.processTextContent(abs));
      });
    }
    
    return content.join('\n');
  }
  
  /**
   * Recursively extract all content from the XML in order
   * @param {Object} element - The XML element to process
   * @param {Array} content - Array to collect all content
   */
  extractContent(element, content) {
    if (!element) return;
    
    // Process absatz elements
    if (element.absatz) {
      const absaetze = Array.isArray(element.absatz) ? element.absatz : [element.absatz];
      
      absaetze.forEach(absatz => {
        const typ = absatz['@_typ'] || '';
        
        // Special handling for novao2 paragraphs with nested <n> elements
        if ((typ === 'novao2' || typ === 'nova2') && absatz.n) {
          content.push({
            type: 'absatz',
            subtype: typ,
            text: this.processAbsatzWithN(absatz)
          });
        } else {
          // Normal processing for other absatz elements
          const text = this.processTextContent(absatz);
          if (text) {
            content.push({
              type: 'absatz',
              subtype: typ,
              text: text
            });
          }
        }
        
        // Handle zitat elements - these often contain the actual change content
        if (absatz.zitat) {
          const zitatText = this.processZitatContent(absatz.zitat);
          if (zitatText) {
            content.push({
              type: 'zitat',
              parentType: typ, // Remember what type of element had this zitat
              text: zitatText
            });
          }
        }
        
        // Process nested tables
      if (absatz.table) {
          const tableText = this.processTableContent(absatz.table);
          content.push({
            type: 'table',
            text: tableText
          });
        }
        
        // Process nested inhaltsvz
        if (absatz.inhaltsvz) {
          const inhaltsvzText = this.processInhaltsvzContent(absatz.inhaltsvz);
          if (inhaltsvzText) {
            content.push({
              type: 'inhaltsvz',
              text: inhaltsvzText
            });
          }
        }
        
        // Recursively process any other content
        this.extractContent(absatz, content);
      });
    }
    
    // Process standalone inhaltsvz elements
    if (element.inhaltsvz && !element.absatz) {
      const inhaltsvzText = this.processInhaltsvzContent(element.inhaltsvz);
      if (inhaltsvzText) {
        content.push({
          type: 'inhaltsvz',
          text: inhaltsvzText
        });
      }
    }
    
    // Process standalone table elements
    if (element.table && !element.absatz) {
      const tableText = this.processTableContent(element.table);
      content.push({
        type: 'table',
        text: tableText
      });
    }
    
    // Process standalone zitat elements
    if (element.zitat && !element.absatz) {
      const zitatText = this.processZitatContent(element.zitat);
      if (zitatText) {
        content.push({
          type: 'zitat',
          text: zitatText
        });
      }
    }
    
    // For abschnitt, process it recursively
    if (element.abschnitt) {
      const abschnitte = Array.isArray(element.abschnitt) ? element.abschnitt : [element.abschnitt];
      abschnitte.forEach(abschnitt => {
        this.extractContent(abschnitt, content);
      });
    }
  }

  /**
   * Process table content to extract text
   * @param {Object|Array} table - The table to process
   * @returns {string} - The extracted table text
   */
  processTableContent(table) {
    if (!table) return "Tabelle im Dokument";
    
    let tableContent = ["Tabelle:"];
    
    // Check if we have rows
    if (table.tr) {
      const rows = Array.isArray(table.tr) ? table.tr : [table.tr];
      
      rows.forEach(row => {
        if (row.td) {
          const cells = Array.isArray(row.td) ? row.td : [row.td];
          let rowText = [];
          
          cells.forEach(cell => {
            if (cell.inhaltsvz) {
              rowText.push(this.processInhaltsvzContent(cell.inhaltsvz));
            } else if (cell['#text']) {
              rowText.push(cell['#text'].trim());
            }
          });
          
          if (rowText.length > 0) {
            tableContent.push(rowText.join(" | "));
          }
        }
      });
    }
    
    return tableContent.join('\n');
  }
  
  /**
   * Process inhaltsvz content (table of contents)
   * @param {Object|Array} inhaltsvz - The inhaltsvz to process
   * @returns {string} - The extracted text
   */
  processInhaltsvzContent(inhaltsvz) {
    if (!inhaltsvz) return "";
    
    const items = Array.isArray(inhaltsvz) ? inhaltsvz : [inhaltsvz];
    let content = [];
    
    items.forEach(item => {
      const text = this.processTextContent(item);
      if (text) {
        content.push(text);
      }
    });
    
    return content.join(' ').trim();
  }
}

export default BgblXmlParser; 