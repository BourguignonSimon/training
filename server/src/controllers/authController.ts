import { Request, Response } from "express";
import axios from "axios";
import { config } from "../config/env.js";

interface StravaTokenResponse {
  token_type: string;
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  athlete: unknown;
}

export const exchangeStravaToken = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    if (!config.strava.clientId || !config.strava.clientSecret) {
      console.error("Strava credentials not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const response = await axios.post<StravaTokenResponse>(
      "https://www.strava.com/oauth/token",
      {
        client_id: config.strava.clientId,
        client_secret: config.strava.clientSecret,
        code: code,
        grant_type: "authorization_code"
      }
    );

    return res.status(200).json(response.data);
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: unknown }; message?: string };
    console.error(
      "Strava Auth Error:",
      axiosError.response?.data || axiosError.message
    );
    return res.status(500).json({
      error: "Failed to authenticate with Strava",
      details: axiosError.response?.data
    });
  }
};

export const refreshStravaToken = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    if (!config.strava.clientId || !config.strava.clientSecret) {
      console.error("Strava credentials not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const response = await axios.post<StravaTokenResponse>(
      "https://www.strava.com/oauth/token",
      {
        client_id: config.strava.clientId,
        client_secret: config.strava.clientSecret,
        refresh_token: refresh_token,
        grant_type: "refresh_token"
      }
    );

    return res.status(200).json(response.data);
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: unknown }; message?: string };
    console.error(
      "Strava Refresh Error:",
      axiosError.response?.data || axiosError.message
    );
    return res.status(500).json({
      error: "Failed to refresh Strava token",
      details: axiosError.response?.data
    });
  }
};
