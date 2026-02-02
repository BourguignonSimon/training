import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import {
  exchangeStravaToken,
  refreshStravaToken
} from "./controllers/authController.js";

const app = express();

// Middlewares
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Auth Routes
app.post("/api/auth/strava", exchangeStravaToken);
app.post("/api/auth/strava/refresh", refreshStravaToken);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Start server (except in test mode)
if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  });
}

export default app;
