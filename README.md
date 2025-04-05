# 📬 Legal News App

Legal News ist eine moderne App zur automatisierten Benachrichtigung über neue Gesetzesänderungen in Österreich und auf EU-Ebene.

## 📱 Features

- Push-Benachrichtigungen zu Gesetzesänderungen
- Themenbasierte Filterung (z. B. Unternehmensrecht, Steuerrecht, etc.)
- Integration mit RIS (Österreich) & EUR-Lex (EU)
- Überblick über Benachrichtigungen & Reminders

## 🧱 Tech Stack

- React Native + Expo
- Node.js Backend
- Firebase (Auth, optional DB)
- RIS API, EUR-Lex RSS

## 📦 Struktur

```
legalnews/
├── backend/              # Node.js RIS/Eurlex Anbindung
├── app/                  # React Native App
├── config/               # API Keys, Firebase etc.
├── components/           # Wiederverwendbare UI
├── hooks/                # Custom React Hooks
├── constants/            # Farbpaletten, Themen, etc.
└── ...
```

## 🚀 Getting Started

```bash
npm install
npm start
```

## 📜 License

MIT
