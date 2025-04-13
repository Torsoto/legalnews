# LegalNews Backend

Backend-Service für die LegalNews-Mobilanwendung, die rechtliche Nachrichten und Updates aus offiziellen Quellen in Österreich bereitstellt.

## Funktionen

- XML-Parsing für rechtliche Dokumente vom österreichischen RIS (Rechtsinformationssystem)
- Integration mit Google's Gemini AI zur Dokumentenzusammenfassung
- Firebase Firestore für Datenspeicherung und -persistenz
- RESTful API-Endpunkte für rechtliche Benachrichtigungen

## Erste Schritte

Diese Anweisungen helfen Ihnen, das Projekt lokal für die Entwicklung einzurichten und auszuführen.

### Voraussetzungen

- Node.js 16+ 
- npm oder yarn
- Firebase-Konto

### Installation

1. Klonen Sie dieses Repository
2. Navigieren Sie zum Backend-Verzeichnis
3. Installieren Sie die Abhängigkeiten:

```bash
npm install
# oder
yarn install
```

### Firebase-Einrichtung

Dieses Projekt verwendet das Firebase Admin SDK. Zur Konfiguration:

1. Gehen Sie zur [Firebase-Konsole](https://console.firebase.google.com/)
2. Navigieren Sie zu Projekteinstellungen > Dienstkonten
3. Klicken Sie auf "Neuen privaten Schlüssel generieren", um Ihren Firebase Admin SDK privaten Schlüssel herunterzuladen
4. Speichern Sie die heruntergeladene Datei im Stammverzeichnis als `serviceAccountKey.json`

### Umgebungsvariablen

Erstellen Sie eine `.env`-Datei im Backend-Verzeichnis mit den folgenden Variablen:

```
# Google API-Schlüssel für Gemini AI
GOOGLE_GENAI_API_KEY=ihr_google_api_schlüssel
# Port für den Server
PORT=3000
```

Ersetzen Sie alle Platzhalter durch Ihre tatsächlichen Werte.

### Anwendung starten

Starten Sie den Entwicklungsserver:

```bash
npm run dev
# oder
yarn dev
```

Der Server läuft standardmäßig auf http://localhost:3000.

## API-Endpunkte

Das Backend stellt derzeit diese Endpunkte bereit:

### Rechtliche Benachrichtigungen
- `GET /api/notifications` - Abrufen der neuesten rechtlichen Benachrichtigungen von der österreichischen RIS-API
- `GET /api/state-notifications` - Abrufen der neuesten Bundesland-Rechtsvorschriften
- `GET /api/stored-notifications` - Abrufen bereits gespeicherter Benachrichtigungen aus Firestore

### Benutzerverwaltung
- `GET /api/user/subscriptions/:userId` - Benutzerabonnements abrufen
- `DELETE /api/user/subscriptions/:userId/:category` - Ein Abonnement entfernen

### Test
- `GET /api/test` - Einfacher Test-Endpunkt zur Überprüfung der API-Konnektivität (keine Authentifizierung erforderlich)

## Fehlerbehandlung

Die API verwendet Standard-HTTP-Statuscodes und gibt Fehler im folgenden Format zurück:

```json
{
  "success": false,
  "error": "Fehlermeldung"
}
```

## Antwortformat

Erfolgreiche Antworten haben folgendes Format:

```json
{
  "success": true,
  "count": 10,
  "notifications": [...]
}
```

## 🔐 Authentifizierung

Diese API verwendet Firebase Authentication mit JWT-Tokens für die Sicherheit. Alle Endpunkte außer `/api/test` erfordern eine Authentifizierung.

### Funktionsweise

1. Das Frontend erhält ein Firebase ID-Token, wenn sich Benutzer anmelden
2. Das Token wird in API-Anfragen als Authorization-Header eingefügt
3. Das Backend verifiziert das Token mit dem Firebase Admin SDK
4. Bei Gültigkeit wird die Anfrage fortgesetzt; andernfalls wird 401 Unauthorized zurückgegeben

### API-Endpunkte testen

Um die Endpunkte in Ihrem Browser oder mit API-Tools zu testen:

#### Option 1: Frontend-Entwicklung

1. Kommentieren Sie in der Frontend-App diese Zeile in `src/utils/auth.js` aus:
   ```javascript
   //console.log('Token:', token); //ONLY FOR TESTING (e.g.: browser with extenstion or postman)
   ```
2. Melden Sie sich in der App an und prüfen Sie die Entwicklungskonsole auf das Token
3. Kopieren Sie das Token zur Verwendung mit den unten genannten Methoden

#### Option 2: Browser-Erweiterungen

1. Installieren Sie eine Header-Modifikations-Erweiterung:
   - [ModHeader für Chrome](https://chrome.google.com/webstore/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj)
   - [ModHeader für Firefox](https://addons.mozilla.org/en-US/firefox/addon/modheader-firefox/)

2. Fügen Sie einen neuen Header hinzu:
   - Name: `Authorization`
   - Wert: `Bearer IHR_ID_TOKEN`

3. Navigieren Sie zu einem API-Endpunkt in Ihrem Browser

#### Option 3: Postman oder ähnliche Tools

1. Erstellen Sie eine neue Anfrage in Postman
2. Wählen Sie unter dem Tab "Authorization" den Typ "Bearer Token"
3. Fügen Sie Ihr Token in das Token-Feld ein
4. Senden Sie Ihre Anfrage an den gewünschten Endpunkt

## Lizenz

Dieses Projekt ist unter der ISC-Lizenz lizenziert.
