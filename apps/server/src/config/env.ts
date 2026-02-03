import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET
  },
  garmin: {
    consumerKey: process.env.GARMIN_CONSUMER_KEY,
    consumerSecret: process.env.GARMIN_CONSUMER_SECRET
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
};

if (!config.strava.clientSecret) {
  console.warn("⚠️ STRAVA_CLIENT_SECRET is missing from .env");
}

if (!config.gemini.apiKey) {
  console.warn("⚠️ GEMINI_API_KEY is missing from .env");
}
