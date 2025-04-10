# LegalNews Backend

Backend service for the LegalNews mobile application, providing legal news and updates from official sources.

## Features

- XML parsing for legal documents
- Integration with Gemini AI (gemini 2.0 flash-lite)
- Firebase integration for authentication and data storage
- RESTful API endpoints for news and user management

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installing

1. Clone this repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

or

```bash
yarn install
```

### Configuration

Create a `.env` file in the backend directory with the following variables:

```
# Google API Key for Gemini AI
GOOGLE_API_KEY=your_google_api_key
```

Firebase admin SKD configuration:
```
# Firebase Configuration 
# 1. Go to the Firebase console
# 2. Go to Project Settings > Service accounts
# 3. Click "Generate new private key" to download your Firebase Admin SDK private key JSON
# 4. Save the downloaded file in the backend/config directory as "serviceAccountKey.json"

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_DATABASE_URL=your_firebase_database_url
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

```

Make sure to replace all placeholders with your actual values.

### Running the Application

Start the development server:

```bash
npm run dev
```

or 

```bash
yarn dev
```

The server will run on http://localhost:3000 by default.

## Project Structure

```
backend/
├── src/
│   ├── index.js          # Main server entry point
│   ├── routes/           # API route definitions
│   ├── controllers/      # Route controllers
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── config/               # Configuration files
│   └── firebase.js       # Firebase configuration
├── .env                  # Environment variables
└── package.json          # Project dependencies
```

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with hot reloading

## API Endpoints

### News Endpoints
- `GET /api/news` - Get all news articles
- `GET /api/news/:id` - Get specific news article
- `GET /api/news/category/:category` - Get news by category

### User Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### RIS API Endpoints
- `GET /api/notifications` - Fetch notifications from RIS API
- `GET /api/stored-notifications` - Fetch notifications from Firestore
- `GET /api/test` - Test endpoint to verify the API is working

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
