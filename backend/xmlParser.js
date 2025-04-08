const { XMLParser } = require('fast-xml-parser');

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
    const xmlData = this.parser.parse(xmlText);
    const notification = {
      id: `bgbl-${metadata.Bgblnummer.replace(/[^0-9]/g, '')}`,
      title: metadata.Bgblnummer,
      description: metadata.Titel,
      publicationDate: metadata.Ausgabedatum,
      isRead: false,
      articles: [],
      category: "Bundesrecht",
      jurisdiction: "BR"
    };

    // Get the main content section
    const abschnitt = xmlData['risdok'] &&
                      xmlData['risdok']['nutzdaten'] &&
                      xmlData['risdok']['nutzdaten']['abschnitt'];
    
    if (!abschnitt) return notification;
    
    // Process the XML structure directly without flattening
    this.extractArticles(abschnitt, notification);
    
    return notification;
  }

  // Extract articles and their changes
  extractArticles(abschnitt, notification) {
    // Step 1: First identify all articles (g1 headers)
    this.identifyArticles(abschnitt, notification);
    
    // Step 2: Identify and associate laws with articles
    this.associateLaws(abschnitt, notification);
    
    // Step 3: Process changes and associate them with the correct articles
    this.processChanges(abschnitt, notification);
  }
  
  // Identify all articles based on g1 headers
  identifyArticles(abschnitt, notification) {
    if (!abschnitt.ueberschrift) return;
    
    const allHeaders = Array.isArray(abschnitt.ueberschrift) 
      ? abschnitt.ueberschrift 
      : [abschnitt.ueberschrift];
    
    let currentTitle = '';
    let currentSubtitle = '';
    
    for (let i = 0; i < allHeaders.length; i++) {
      const header = allHeaders[i];
      const typ = header['@_typ'] || '';
      const text = this.processTextContent(header);
      
      if (typ === 'g1') {
        currentTitle = text;
        currentSubtitle = '';
        
        // Look ahead for subtitle (g2)
        if (i + 1 < allHeaders.length && allHeaders[i+1]['@_typ'] === 'g2') {
          currentSubtitle = this.processTextContent(allHeaders[i+1]);
        }
        
        // Create new article
        notification.articles.push({
          id: `art-${notification.articles.length + 1}`,
          title: currentTitle,
          subtitle: currentSubtitle,
          law: '',
          changes: []
        });
      }
    }
  }
  
  // Associate laws with their articles
  associateLaws(abschnitt, notification) {
    if (!abschnitt.absatz || notification.articles.length === 0) return;
    
    const allParagraphs = Array.isArray(abschnitt.absatz) 
      ? abschnitt.absatz 
      : [abschnitt.absatz];
    
    let articleIndex = 0;
    
    for (let i = 0; i < allParagraphs.length; i++) {
      const para = allParagraphs[i];
      if (para['@_typ'] === 'promkleinlsatz') {
        const lawText = this.processTextContent(para);
        
        // Check if we've found a new article's law
        if (lawText.includes('geändert') && articleIndex < notification.articles.length) {
          notification.articles[articleIndex].law = lawText;
          articleIndex++;
        }
      }
    }
  }
  
  // Process changes and associate them with the correct articles
  processChanges(abschnitt, notification) {
    if (!abschnitt.absatz || notification.articles.length === 0) return;
    
    const allParagraphs = Array.isArray(abschnitt.absatz) 
      ? abschnitt.absatz 
      : [abschnitt.absatz];
    
    // Divide paragraphs into sections by article
    const sections = this.divideIntoSections(abschnitt);
    
    // Process each section (article)
    for (let s = 0; s < sections.length && s < notification.articles.length; s++) {
      const section = sections[s];
      const article = notification.articles[s];
      let currentChange = null;
      
      // Process all elements in this section
      for (let i = 0; i < section.length; i++) {
        const element = section[i];
        
        // Process absatz elements
        if (element.absatz) {
          const absaetze = Array.isArray(element.absatz) 
            ? element.absatz 
            : [element.absatz];
          
          for (const absatz of absaetze) {
            const typ = absatz['@_typ'] || '';
            const text = this.processTextContent(absatz);
            
            // New change instruction
            if (typ === 'novao1' || typ === 'novao2') {
              // Finish previous change
              if (currentChange) {
                article.changes.push(currentChange);
              }
              
              // Start new change
              currentChange = {
                id: `change-${article.changes.length + 1}`,
                instruction: text,
                newText: ''
              };
            } 
            // Change content
            else if ((typ === 'satz' || typ === 'abs') && currentChange) {
              currentChange.newText = this.appendText(currentChange.newText, text);
            }
          }
        }
        
        // Process ueberschrift elements for paragraph headers
        if (element.ueberschrift) {
          const headers = Array.isArray(element.ueberschrift) 
            ? element.ueberschrift 
            : [element.ueberschrift];
          
          for (const header of headers) {
            if (header['@_typ'] === 'para' && currentChange) {
              currentChange.newText = this.appendText(
                currentChange.newText, 
                this.processTextContent(header)
              );
            }
          }
        }
        
        // Process liste elements
        if (element.liste && currentChange) {
          const listen = Array.isArray(element.liste) 
            ? element.liste 
            : [element.liste];
          
          for (const liste of listen) {
            currentChange.newText = this.appendText(
              currentChange.newText,
              this.processListContent(liste['aufzaehlung'])
            );
          }
        }
      }
      
      // Add final change if exists
      if (currentChange) {
        article.changes.push(currentChange);
      }
    }
  }
  
  // Divide the XML content into sections based on article boundaries
  divideIntoSections(abschnitt) {
    const sections = [];
    let currentSection = [];
    let inArticle = false;
    
    // Create a flat representation for easier processing
    const flatElements = this.flattenStructure(abschnitt);
    
    for (let i = 0; i < flatElements.length; i++) {
      const element = flatElements[i];
      
      // Check for article header (g1)
      if (element.ueberschrift) {
        const headers = Array.isArray(element.ueberschrift) 
          ? element.ueberschrift 
          : [element.ueberschrift];
        
        for (const header of headers) {
          if (header['@_typ'] === 'g1') {
            // Start a new section if we were in an article
            if (inArticle) {
              sections.push(currentSection);
              currentSection = [];
            }
            inArticle = true;
            currentSection.push(element);
            break;
          }
        }
        continue;
      }
      
      // Add element to current section if we're in an article
      if (inArticle) {
        currentSection.push(element);
      }
    }
    
    // Add the last section if not empty
    if (currentSection.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  // Create a flat representation of the XML structure
  flattenStructure(element) {
    const result = [];
    
    const processNode = (node) => {
      // Add the node itself
      result.push(node);
      
      // Process children
      for (const key in node) {
        if (key !== '@_' && key !== '#text') {
          const value = node[key];
          
          if (Array.isArray(value)) {
            value.forEach(child => {
              if (typeof child === 'object' && child !== null) {
                processNode(child);
              }
            });
          } else if (typeof value === 'object' && value !== null) {
            processNode(value);
          }
        }
      }
    };
    
    processNode(element);
    return result;
  }
}

module.exports = BgblXmlParser;