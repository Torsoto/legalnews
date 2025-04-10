# LegalNews Backend

Backend service for the LegalNews mobile application, providing legal news and updates from official sources.

## Features

- XML parsing for legal documents
- Integration with Gemini AI (gemini 2.0 flash-lite)
- Firebase integration for authentication and data storage
- RESTful API endpoints for news and user management

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Cloud account with API access
- Firebase project

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Google API Configuration
GOOGLE_API_KEY=your_google_api_key

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

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
