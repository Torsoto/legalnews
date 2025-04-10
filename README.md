# 📬 Legal News App

Legal News ist eine moderne App zur automatisierten Benachrichtigung über neue Gesetzesänderungen in Österreich und auf EU-Ebene.

## 📱 Features

- Push-Benachrichtigungen zu Gesetzesänderungen
- Themenbasierte Filterung (z. B. Unternehmensrecht, Steuerrecht, etc.)
- Integration mit RIS (Österreich) & EUR-Lex (EU)
- Überblick über Benachrichtigungen & Reminders
- Automatische Kategorisierung durch Gemini AI (gemini 2.0 flash-lite)

## 🧱 Tech Stack

### Frontend
- React Native + Expo
- Firebase Authentication
- AsyncStorage für lokale Daten

### Backend
- Node.js + Express
- XML Parsing für Gesetzesdokumente
- Gemini AI Integration für Kategorisierung
- Firebase Integration
- RESTful API

## 📦 Projektstruktur

```
legalnews/
├── app/                  # React Native Frontend
│   ├── src/
│   │   ├── screens/     # App Screens
│   │   ├── components/  # Wiederverwendbare UI
│   │   ├── hooks/       # Custom React Hooks
│   │   └── constants/   # Farbpaletten, Themen, etc.
│   └── App.jsx         # Hauptkomponente
│
├── backend/             # Node.js Backend
│   ├── src/
│   │   ├── routes/     # API Endpoints
│   │   ├── services/   # Business Logic
│   │   └── utils/      # Hilfsfunktionen
│   ├── config/         # Firebase & API Konfiguration
│   └── .env           # Umgebungsvariablen
│
└── package.json        # Projektabhängigkeiten
```

## 🚀 Getting Started

### Frontend Setup
```bash
cd app
npm install
npm start
```

### Backend Setup
```bash
cd backend
npm install
# Erstelle .env Datei mit:
# - GOOGLE_API_KEY
# - FIREBASE_API_KEY
# - FIREBASE_AUTH_DOMAIN
# - FIREBASE_PROJECT_ID
# - FIREBASE_STORAGE_BUCKET
# - FIREBASE_MESSAGING_SENDER_ID
# - FIREBASE_APP_ID
# - FIREBASE_MEASUREMENT_ID
npm run dev
```

## 📜 License

MIT
