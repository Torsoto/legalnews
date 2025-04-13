# 📬 Legal News App

Legal News is a modern app for automated notifications about new legislative changes in Austria and at the EU level.

## 📱 Features

- Push notifications for legislative changes
- Topic-based filtering (e.g., corporate law, tax law, etc.)
- Integration with RIS (Austria) & EUR-Lex (EU)
- Overview of notifications & reminders
- Automatic categorization using Gemini AI (gemini 2.0 flash-lite)

## 🧱 Tech Stack

### Frontend
- React Native + Expo
- Firebase Authentication
- AsyncStorage for local data

### Backend
- Node.js + Express
- XML Parsing for legal documents
- Gemini AI Integration for categorization
- Firebase Integration
- RESTful API

## 🔐 Authentication

The app uses Firebase Authentication for secure access to the API:

1. Users sign in through Firebase Authentication
2. ID tokens are automatically added to API requests
3. The backend verifies tokens with Firebase Admin SDK

### Testing API Endpoints in Browser

To test API endpoints in your browser:

1. **In the application**:
   - Uncomment line 11 `//console.log('Token:', token);` in `src/utils/auth.js`
   - Sign in to the app to obtain a token
   - The token will be displayed in the console

2. **With browser extensions**:
   - Install a header modification extension (e.g., ModHeader for Chrome, Modify-header-value for Firefox)
   - Add a header:
     - Name: `Authorization`
     - Value: `Bearer YOUR_TOKEN_HERE`

3. **With Postman**:
   - Create a new request to the desired endpoint
   - Add a Bearer Token under "Authorization"
   - Paste your copied token

## 🚀 Getting Started

### Frontend Setup
```bash
cd app
npm install
npm run start
```

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

## 📜 License

MIT
