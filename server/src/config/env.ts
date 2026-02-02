import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET
  },
  garmin: {
    consumerKey: process.env.GARMIN_CONSUMER_KEY,
    consumerSecret: process.env.GARMIN_CONSUMER_SECRET
  },
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173"
};

if (!config.strava.clientSecret) {
  console.warn("⚠️ STRAVA_CLIENT_SECRET is missing from .env");
}
