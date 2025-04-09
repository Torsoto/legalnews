// xmlParser.js
import { XMLParser } from 'fast-xml-parser';

class BgblXmlParser {
    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            parseTagValue: true, 
            parseAttributeValue: true,
            trimValues: true, 
            ignoreDeclaration: true,
            removeNSPrefix: true,
            isArray: (name, jpath) => {
                 return ['ueberschrift', 'absatz', 'liste', 'aufzaehlung', 'listelem', 'ContentUrl', 'table', 'tr', 'td'].includes(name);
            }
        });
    }

    // Helper: Safely get text content
    getText(element) {
        if (typeof element === 'string') {
            return element.trim();
        }
        if (element && typeof element === 'object' && element['#text'] !== undefined && element['#text'] !== null) {
            if(Array.isArray(element['#text'])) {
                return element['#text'].map(t => String(t).trim()).join(' ').trim();
            }
            return String(element['#text']).trim();
        }
        
        let accumulatedText = '';
        if (element && typeof element === 'object') {
             for (const key in element) {
                 if (!key.startsWith('@_') && key !== '#text') {
                     const value = element[key];
                     accumulatedText = this.appendText(accumulatedText, this.getText(value), true);
                 }
             }
        }
        return accumulatedText.trim();
    }

    // Helper: Append text cleanly
    appendText(existing, addition, preferSpace = false) {
        const trimmedExisting = existing ? existing.trim() : '';
        const trimmedAddition = addition ? addition.trim() : '';
        if (!trimmedAddition) return trimmedExisting;
        if (!trimmedExisting) return trimmedAddition;
        
        const punctuationEnd = /[.,;:!?]$/;
        const punctuationStart = /^[.,;:!?]/;
        
        let separator = '\n'; 
        if (preferSpace) separator = ' ';
        if (punctuationEnd.test(trimmedExisting) || punctuationStart.test(trimmedAddition)) {
            separator = ' ';
        }
        if (trimmedExisting.endsWith('\n')) separator = '';
        if (trimmedAddition.startsWith('\n')) separator = '';

        return trimmedExisting + separator + trimmedAddition;
    }

    parse(xmlText, metadata) {
        let xmlData;
        try {
             xmlData = this.parser.parse(xmlText);
        } catch (e) {
             console.error(`[${metadata.Bgblnummer}] Failed to parse XML: ${e.message}`);
             return {
                 id: `bgbl-${metadata.Bgblnummer.replace(/[^0-9]/g, '')}-error`,
                 title: `${metadata.Bgblnummer} (Parse Error)`,
                 description: `Failed to parse XML content. Error: ${e.message}`,
                 publicationDate: metadata.Ausgabedatum,
                 isRead: false,
                 articles: [],
                 aiSummary: "Error parsing document",
                 category: "Bundesrecht",
                 error: true
             };
        }
        
        const notification = {
            id: `bgbl-${metadata.Bgblnummer.replace(/[^0-9]/g, '')}`,
            title: metadata.Bgblnummer,
            description: metadata.Titel,
            publicationDate: metadata.Ausgabedatum,
            isRead: false,
            articles: [],
            aiSummary: "", // Will be filled by AI
            category: "Bundesrecht"
        };

        const abschnitt = xmlData?.['risdok']?.['nutzdaten']?.['abschnitt'];
        if (!abschnitt) {
            notification.articles.push({ id: 'art-1', title: 'Kein Inhalt gefunden', subtitle: '' });
            return notification;
        }

        this.processAbschnittSequentially(abschnitt, notification);

        if(notification.articles.length === 0) {
             notification.articles.push({ id: 'art-1', title: 'Keine Artikel identifiziert', subtitle: '' });
        }

        return notification;
    }

    processAbschnittSequentially(abschnitt, notification) {
        let currentArticle = null;
        
        const entries = Object.entries(abschnitt); 

        for (const [key, value] of entries) {
            if (key.startsWith('@_')) continue; 

            const elements = Array.isArray(value) ? value : [value];

            for (const element of elements) {
                if (!element) continue; 
                const elementType = typeof element;

                // --- Handle Ueberschrift (Headings) ---
                if (key === 'ueberschrift' && elementType === 'object') {
                    const typ = element['@_typ'];
                    const text = this.getText(element);
                    const isArticleHeading = typ === 'g1' && text.match(/^Artikel\s+\d+/i); 

                    if (isArticleHeading) { 
                        currentArticle = {
                            id: `art-${notification.articles.length + 1}`,
                            title: text,
                            subtitle: ''
                        };
                        notification.articles.push(currentArticle);
                    } else if (typ === 'g2' && currentArticle && !currentArticle.subtitle) {
                        currentArticle.subtitle = text;
                    }
                }
            }
        }
    }
}

export default BgblXmlParser;