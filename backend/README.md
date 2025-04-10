# LegalNews Backend

Backend service for the LegalNews mobile application, providing legal news and updates from official sources in Austria.

## Features

- XML parsing for legal documents from the Austrian RIS (Rechtsinformationssystem)
- Integration with Google's Gemini AI for document summarization
- Firebase Firestore for data storage and persistence
- RESTful API endpoints for legal notifications

## Getting Started

These instructions will help you set up and run the project locally for development.

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Firebase account

### Installation

1. Clone this repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

### Firebase Setup

This project uses Firebase Admin SDK. To configure it:

1. Go to the [Firebase console](https://console.firebase.google.com/)
2. Navigate to Project Settings > Service accounts
3. Click "Generate new private key" to download your Firebase Admin SDK private key JSON
4. Save the downloaded file in the root directory as `serviceAccountKey.json`

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# Google API Key for Gemini AI
GOOGLE_API_KEY=your_google_api_key
```

Replace all placeholders with your actual values.

### Running the Application

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The server will run on http://localhost:3000 by default.

## API Endpoints

The backend currently provides these endpoints:

### Legal Notifications
- `GET /api/notifications` - Fetch latest legal notifications from the Austrian RIS API
- `GET /api/stored-notifications` - Retrieve already stored notifications from Firestore
- `GET /api/test` - Simple test endpoint to verify API connectivity

## Project Structure

```
backend/
├── config/
│   └── firebase-admin.js    # Firebase Admin SDK configuration
├── src/
│   ├── server.js            # Main server entry point
│   ├── xmlParser.js         # XML parsing logic for legal documents
│   ├── AI.js                # Gemini AI integration for summarization
│   └── service/
│       └── firestoreService.js  # Firebase Firestore operations
├── .env                     # Environment variables
└── package.json             # Project dependencies
```

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Response Format

Successful responses follow this format:

```json
{
  "success": true,
  "count": 10,
  "notifications": [...]
}
```

## License

This project is licensed under the ISC License.
