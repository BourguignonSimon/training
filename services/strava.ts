import { Activity } from "../types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_STORAGE_KEY = "stravaTokens";

const getBackendUrl = () =>
  import.meta.env.VITE_API_URL || "http://localhost:3001";

type StravaTokenPayload = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

const getEnv = (key: string) => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing ${key} environment variable.`);
  }
  return value;
};

const getRedirectUri = () =>
  import.meta.env.VITE_STRAVA_REDIRECT_URI || window.location.origin;

export const getStravaAuthUrl = () => {
  const clientId = getEnv("VITE_STRAVA_CLIENT_ID");
  const redirectUri = getRedirectUri();
  const scope = "read,activity:read_all";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope,
    state: "strava"
  });
  return `${STRAVA_AUTH_URL}?${params.toString()}`;
};

export const getStoredStravaTokens = (): StravaTokenPayload | null => {
  const raw = window.localStorage.getItem(STRAVA_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StravaTokenPayload;
  } catch (error) {
    console.error("Failed to parse Strava tokens", error);
    return null;
  }
};

const storeStravaTokens = (tokens: StravaTokenPayload) => {
  window.localStorage.setItem(STRAVA_STORAGE_KEY, JSON.stringify(tokens));
};

export const clearStravaTokens = () => {
  window.localStorage.removeItem(STRAVA_STORAGE_KEY);
};

export const exchangeStravaToken = async (code: string) => {
  const response = await fetch(`${getBackendUrl()}/api/auth/strava`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Strava authorization code.");
  }

  const data = (await response.json()) as StravaTokenPayload;
  storeStravaTokens(data);
  return data;
};

export const refreshStravaToken = async (refreshToken: string) => {
  const response = await fetch(`${getBackendUrl()}/api/auth/strava/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Strava token.");
  }

  const data = (await response.json()) as StravaTokenPayload;
  storeStravaTokens(data);
  return data;
};

const getValidStravaAccessToken = async () => {
  const tokens = getStoredStravaTokens();
  if (!tokens) {
    return null;
  }
  const expiresAtMs = tokens.expires_at * 1000;
  if (expiresAtMs - Date.now() > 60_000) {
    return tokens.access_token;
  }
  const refreshed = await refreshStravaToken(tokens.refresh_token);
  return refreshed.access_token;
};

const mapStravaActivityType = (type?: string) => {
  if (!type) {
    return "Run" as const;
  }
  if (type.toLowerCase().includes("trail")) {
    return "TrailRun" as const;
  }
  if (type.toLowerCase().includes("hike")) {
    return "Hike" as const;
  }
  return "Run" as const;
};

export const fetchStravaActivities = async (): Promise<Activity[]> => {
  const accessToken = await getValidStravaAccessToken();
  if (!accessToken) {
    return [];
  }
  const after = Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 30) / 1000);
  const response = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?after=${after}&per_page=30`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Strava activities.");
  }

  const data = (await response.json()) as Array<{
    id: number;
    name: string;
    type: string;
    distance: number;
    moving_time: number;
    total_elevation_gain: number;
    start_date: string;
    calories?: number;
  }>;

  return data.map((activity) => ({
    id: String(activity.id),
    name: activity.name,
    type: mapStravaActivityType(activity.type),
    distance: Math.round((activity.distance / 1000) * 10) / 10,
    duration: Math.round(activity.moving_time / 60),
    elevationGain: Math.round(activity.total_elevation_gain),
    date: activity.start_date.split("T")[0],
    calories: Math.round(activity.calories ?? 0)
  }));
};
