import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/env.js";
import {
  exchangeStravaToken,
  refreshStravaToken,
  stravaCallback,
  logout,
  checkAuth,
} from "./controllers/authController.js";
import { generateTrainingPlan } from "./controllers/aiController.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true, // Required for cookies to be sent cross-origin
  })
);
app.use(express.json());
app.use(cookieParser());

// Auth Routes
app.get("/api/auth/strava/callback", stravaCallback);
app.post("/api/auth/strava", exchangeStravaToken);
app.post("/api/auth/strava/refresh", refreshStravaToken);
app.post("/api/auth/logout", logout);
app.get("/api/auth/check", checkAuth);

// AI Routes
app.post("/api/ai/generate-plan", generateTrainingPlan);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Start server (except in test mode)
if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

export default app;
