import { Activity } from "../types";

const GARMIN_STORAGE_KEY = "garminTokens";

type GarminTokenPayload = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
};

const getEnv = (key: string) => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing ${key} environment variable.`);
  }
  return value;
};

const getRedirectUri = () =>
  import.meta.env.VITE_GARMIN_REDIRECT_URI || window.location.origin;

export const getGarminAuthUrl = () => {
  const clientId = getEnv("VITE_GARMIN_CLIENT_ID");
  const redirectUri = getRedirectUri();
  const authUrl = getEnv("VITE_GARMIN_AUTH_URL");
  const scope = import.meta.env.VITE_GARMIN_SCOPE || "activities";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state: "garmin"
  });
  return `${authUrl}?${params.toString()}`;
};

export const getStoredGarminTokens = (): GarminTokenPayload | null => {
  const raw = window.localStorage.getItem(GARMIN_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as GarminTokenPayload;
  } catch (error) {
    console.error("Failed to parse Garmin tokens", error);
    return null;
  }
};

const storeGarminTokens = (tokens: GarminTokenPayload) => {
  window.localStorage.setItem(GARMIN_STORAGE_KEY, JSON.stringify(tokens));
};

export const clearGarminTokens = () => {
  window.localStorage.removeItem(GARMIN_STORAGE_KEY);
};

export const exchangeGarminToken = async (code: string) => {
  const clientId = getEnv("VITE_GARMIN_CLIENT_ID");
  const clientSecret = getEnv("VITE_GARMIN_CLIENT_SECRET");
  const tokenUrl = getEnv("VITE_GARMIN_TOKEN_URL");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri()
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Garmin authorization code.");
  }

  const data = (await response.json()) as GarminTokenPayload;
  const expiresAt = data.expires_at
    ? data.expires_at
    : data.expires_in
      ? Math.floor(Date.now() / 1000) + data.expires_in
      : undefined;
  const normalized = { ...data, expires_at: expiresAt };
  storeGarminTokens(normalized);
  return normalized;
};

export const refreshGarminToken = async (refreshToken: string) => {
  const clientId = getEnv("VITE_GARMIN_CLIENT_ID");
  const clientSecret = getEnv("VITE_GARMIN_CLIENT_SECRET");
  const tokenUrl = getEnv("VITE_GARMIN_TOKEN_URL");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Garmin token.");
  }

  const data = (await response.json()) as GarminTokenPayload;
  const expiresAt = data.expires_at
    ? data.expires_at
    : data.expires_in
      ? Math.floor(Date.now() / 1000) + data.expires_in
      : undefined;
  const normalized = { ...data, expires_at: expiresAt };
  storeGarminTokens(normalized);
  return normalized;
};

const getValidGarminAccessToken = async () => {
  const tokens = getStoredGarminTokens();
  if (!tokens?.access_token) {
    return null;
  }
  if (!tokens.expires_at) {
    return tokens.access_token;
  }
  const expiresAtMs = tokens.expires_at * 1000;
  if (expiresAtMs - Date.now() > 60_000) {
    return tokens.access_token;
  }
  if (!tokens.refresh_token) {
    return tokens.access_token;
  }
  const refreshed = await refreshGarminToken(tokens.refresh_token);
  return refreshed.access_token;
};

const mapGarminActivityType = (type?: string) => {
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

export const fetchGarminActivities = async (): Promise<Activity[]> => {
  const accessToken = await getValidGarminAccessToken();
  if (!accessToken) {
    return [];
  }

  const apiBase = getEnv("VITE_GARMIN_API_BASE");
  const startTimeSeconds = Math.floor(
    (Date.now() - 1000 * 60 * 60 * 24 * 30) / 1000
  );
  const endTimeSeconds = Math.floor(Date.now() / 1000);
  const response = await fetch(
    `${apiBase}/wellness-api/rest/activities?startTimeInSeconds=${startTimeSeconds}&endTimeInSeconds=${endTimeSeconds}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Garmin activities.");
  }

  const data = (await response.json()) as Array<{
    activityId: string | number;
    activityName: string;
    activityType?: string;
    distanceInMeters?: number;
    durationInSeconds?: number;
    elevationGainInMeters?: number;
    startTimeLocal?: string;
    calories?: number;
  }>;

  return data.map((activity) => ({
    id: String(activity.activityId),
    name: activity.activityName,
    type: mapGarminActivityType(activity.activityType),
    distance: Math.round(((activity.distanceInMeters ?? 0) / 1000) * 10) / 10,
    duration: Math.round((activity.durationInSeconds ?? 0) / 60),
    elevationGain: Math.round(activity.elevationGainInMeters ?? 0),
    date: (activity.startTimeLocal ?? "").split("T")[0],
    calories: Math.round(activity.calories ?? 0)
  }));
};
