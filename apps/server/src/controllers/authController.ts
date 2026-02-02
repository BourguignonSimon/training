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

// Cookie configuration for secure token storage
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents JavaScript access (blocks XSS)
  secure: config.nodeEnv === "production", // HTTPS only in production
  sameSite: "strict" as const, // CSRF protection
};

/**
 * Helper function to exchange authorization code for tokens
 */
const exchangeToken = async (code: string): Promise<StravaTokenResponse> => {
  const response = await axios.post<StravaTokenResponse>(
    "https://www.strava.com/oauth/token",
    {
      client_id: config.strava.clientId,
      client_secret: config.strava.clientSecret,
      code: code,
      grant_type: "authorization_code",
    }
  );
  return response.data;
};

/**
 * OAuth callback handler - stores tokens in HttpOnly cookies
 * This is more secure than returning tokens to the client
 */
export const stravaCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  try {
    if (!code || typeof code !== "string") {
      return res.redirect(`${config.frontendUrl}/login?error=missing_code`);
    }

    if (!config.strava.clientId || !config.strava.clientSecret) {
      console.error("Strava credentials not configured");
      return res.redirect(`${config.frontendUrl}/login?error=server_config`);
    }

    const tokenData = await exchangeToken(code);

    // Store tokens in HttpOnly cookies (inaccessible via JavaScript)
    res.cookie("access_token", tokenData.access_token, {
      ...COOKIE_OPTIONS,
      maxAge: 3600 * 1000, // 1 hour
    });

    res.cookie("refresh_token", tokenData.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 24 * 3600 * 1000, // 30 days
    });

    // Redirect to dashboard after successful auth
    res.redirect(`${config.frontendUrl}/dashboard`);
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { data?: unknown };
      message?: string;
    };
    console.error(
      "Strava Callback Error:",
      axiosError.response?.data || axiosError.message
    );
    res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
  }
};

/**
 * API endpoint for token exchange (legacy support)
 * Returns tokens in response body for clients that need it
 */
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

    const tokenData = await exchangeToken(code);

    // Also set cookies for enhanced security
    res.cookie("access_token", tokenData.access_token, {
      ...COOKIE_OPTIONS,
      maxAge: 3600 * 1000,
    });

    res.cookie("refresh_token", tokenData.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 24 * 3600 * 1000,
    });

    return res.status(200).json(tokenData);
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { data?: unknown };
      message?: string;
    };
    console.error(
      "Strava Auth Error:",
      axiosError.response?.data || axiosError.message
    );
    return res.status(500).json({
      error: "Failed to authenticate with Strava",
      details: axiosError.response?.data,
    });
  }
};

export const refreshStravaToken = async (req: Request, res: Response) => {
  try {
    // Try to get refresh token from cookie first, then from body
    const refresh_token = req.cookies?.refresh_token || req.body.refresh_token;

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
        grant_type: "refresh_token",
      }
    );

    // Update cookies with new tokens
    res.cookie("access_token", response.data.access_token, {
      ...COOKIE_OPTIONS,
      maxAge: 3600 * 1000,
    });

    res.cookie("refresh_token", response.data.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 24 * 3600 * 1000,
    });

    return res.status(200).json(response.data);
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { data?: unknown };
      message?: string;
    };
    console.error(
      "Strava Refresh Error:",
      axiosError.response?.data || axiosError.message
    );
    return res.status(500).json({
      error: "Failed to refresh Strava token",
      details: axiosError.response?.data,
    });
  }
};

/**
 * Logout handler - clears authentication cookies
 */
export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  return res.status(200).json({ message: "Logged out successfully" });
};

/**
 * Check authentication status
 */
export const checkAuth = async (req: Request, res: Response) => {
  const accessToken = req.cookies?.access_token;

  if (!accessToken) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true });
};
