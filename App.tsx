import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TrainingView } from './components/TrainingView';
import { NutritionView } from './components/NutritionView';
import { SettingsView } from './components/SettingsView';
import { ViewState, WeeklyPlan, NutritionDay, Activity, UserProfile, NutritionPlanDay } from './types';
import { generateTrainingPlan, getFallbackTrainingPlan, validateGeminiApiKey } from './services/gemini';
import { clearStravaTokens, exchangeStravaToken, fetchStravaActivities, getStoredStravaTokens, getStravaAuthUrl } from './services/strava';
import { clearGarminTokens, exchangeGarminToken, fetchGarminActivities, getStoredGarminTokens, getGarminAuthUrl } from './services/garmin';

const INITIAL_USER: UserProfile = {
  name: "Trail Runner",
  raceDistance: 175,
  raceDate: "2025-08-24",
  stravaConnected: false,
  garminConnected: false,
  fitnessLevel: 'Advanced'
};

const INITIAL_NUTRITION: NutritionDay = {
  date: new Date().toISOString().split('T')[0],
  meals: [],
  targets: {
    calories: 3200,
    protein: 140,
    carbs: 450,
    fats: 90
  }
};

type IntegrationState = {
  connected: boolean;
  syncing: boolean;
  error?: string;
  lastSync?: string;
};

const STORAGE_KEYS = {
  user: "trail.user",
  plan: "trail.plan",
  nutrition: "trail.nutrition",
  nutritionPlan: "trail.nutritionPlan"
};

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }
    return JSON.parse(stored) as T;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage`, error);
    return fallback;
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [plan, setPlan] = useState<WeeklyPlan | null>(() =>
    loadFromStorage<WeeklyPlan | null>(STORAGE_KEYS.plan, null)
  );
  const [nutrition, setNutrition] = useState<NutritionDay>(() =>
    loadFromStorage<NutritionDay>(STORAGE_KEYS.nutrition, INITIAL_NUTRITION)
  );
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlanDay[]>(() =>
    loadFromStorage<NutritionPlanDay[]>(STORAGE_KEYS.nutritionPlan, [])
  );
  const [user, setUser] = useState<UserProfile>(() =>
    loadFromStorage<UserProfile>(STORAGE_KEYS.user, INITIAL_USER)
  );
  const [integrations, setIntegrations] = useState<{
    strava: IntegrationState;
    garmin: IntegrationState;
  }>({
    strava: { connected: Boolean(getStoredStravaTokens()), syncing: false },
    garmin: { connected: Boolean(getStoredGarminTokens()), syncing: false }
  });
  const [apiStatus, setApiStatus] = useState<{
    state: "checking" | "valid" | "missing" | "invalid";
    message?: string;
  }>({ state: "checking" });
  
  useEffect(() => {
    let isMounted = true;
    const checkApiKey = async () => {
      const result = await validateGeminiApiKey();
      if (!isMounted) {
        return;
      }
      if (result.status === "valid") {
        setApiStatus({ state: "valid" });
      } else {
        setApiStatus({ state: result.status, message: result.message });
      }
    };
    checkApiKey();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setUser((prev) => ({
      ...prev,
      stravaConnected: Boolean(getStoredStravaTokens()),
      garminConnected: Boolean(getStoredGarminTokens())
    }));
  }, []);

  useEffect(() => {
    if (apiStatus.state === "checking" || plan) {
      return;
    }
    const fetchPlan = async () => {
      // In a real app, check if we have this week stored, else generate
      if (apiStatus.state === "valid") {
        const newPlan = await generateTrainingPlan(16, 'Advanced', new Date().toISOString().split('T')[0]);
        setPlan(newPlan);
        return;
      }
      setPlan(getFallbackTrainingPlan());
    };
    fetchPlan();
  }, [apiStatus.state, plan]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const provider = params.get("state") || params.get("provider");
    if (!code || !provider) {
      return;
    }
    if (provider !== "strava" && provider !== "garmin") {
      return;
    }
    const handleOAuth = async () => {
      try {
        if (provider === "strava") {
          await exchangeStravaToken(code);
        }
        if (provider === "garmin") {
          await exchangeGarminToken(code);
        }
        setIntegrations((prev) => ({
          ...prev,
          [provider]: {
            ...prev[provider as "strava" | "garmin"],
            connected: true,
            error: undefined
          }
        }));
        setUser((prev) => ({
          ...prev,
          stravaConnected: provider === "strava" ? true : prev.stravaConnected,
          garminConnected: provider === "garmin" ? true : prev.garminConnected
        }));
      } catch (error) {
        console.error("OAuth failed", error);
        setIntegrations((prev) => ({
          ...prev,
          [provider]: {
            ...prev[provider as "strava" | "garmin"],
            error: "Authentication failed. Check your integration settings."
          }
        }));
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    handleOAuth();
  }, []);

  useEffect(() => {
    const loadActivities = async () => {
      setIntegrations((prev) => ({
        strava: { ...prev.strava, syncing: true, error: undefined },
        garmin: { ...prev.garmin, syncing: true, error: undefined }
      }));
      try {
        const [stravaResult, garminResult] = await Promise.allSettled([
          fetchStravaActivities(),
          fetchGarminActivities()
        ]);
        const stravaActivities =
          stravaResult.status === "fulfilled" ? stravaResult.value : [];
        const garminActivities =
          garminResult.status === "fulfilled" ? garminResult.value : [];
        const nextActivities = [...stravaActivities, ...garminActivities].sort(
          (a, b) => (a.date < b.date ? 1 : -1)
        );
        setActivities(nextActivities);
        setIntegrations((prev) => ({
          strava: {
            ...prev.strava,
            syncing: false,
            error:
              stravaResult.status === "rejected"
                ? "Unable to sync Strava activities."
                : prev.strava.error,
            lastSync: stravaResult.status === "fulfilled"
              ? new Date().toISOString()
              : prev.strava.lastSync
          },
          garmin: {
            ...prev.garmin,
            syncing: false,
            error:
              garminResult.status === "rejected"
                ? "Unable to sync Garmin activities."
                : prev.garmin.error,
            lastSync: garminResult.status === "fulfilled"
              ? new Date().toISOString()
              : prev.garmin.lastSync
          }
        }));
      } catch (error) {
        console.error("Failed to load activities", error);
        setIntegrations((prev) => ({
          strava: { ...prev.strava, syncing: false, error: prev.strava.error ?? "Unable to sync Strava activities." },
          garmin: { ...prev.garmin, syncing: false, error: prev.garmin.error ?? "Unable to sync Garmin activities." }
        }));
      }
    };
    loadActivities();
  }, [user.stravaConnected, user.garminConnected]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      if (plan) {
        window.localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(plan));
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.plan);
      }
    } catch (error) {
      console.warn("Failed to persist training plan", error);
    }
  }, [plan]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEYS.nutrition, JSON.stringify(nutrition));
    } catch (error) {
      console.warn("Failed to persist nutrition log", error);
    }
  }, [nutrition]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEYS.nutritionPlan, JSON.stringify(nutritionPlan));
    } catch (error) {
      console.warn("Failed to persist nutrition plan", error);
    }
  }, [nutritionPlan]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    } catch (error) {
      console.warn("Failed to persist user settings", error);
    }
  }, [user]);

  const handleAddMeal = (meal: any) => {
    setNutrition(prev => ({
      ...prev,
      meals: [...prev.meals, meal]
    }));
  };

  const handleConnect = (provider: "strava" | "garmin") => {
    try {
      const authUrl = provider === "strava" ? getStravaAuthUrl() : getGarminAuthUrl();
      window.location.assign(authUrl);
    } catch (error) {
      console.error("Failed to start OAuth", error);
      setIntegrations((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          error: "Missing integration configuration."
        }
      }));
    }
  };

  const handleDisconnect = (provider: "strava" | "garmin") => {
    if (provider === "strava") {
      clearStravaTokens();
    } else {
      clearGarminTokens();
    }
    setIntegrations((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], connected: false }
    }));
    setUser((prev) => ({
      ...prev,
      stravaConnected: provider === "strava" ? false : prev.stravaConnected,
      garminConnected: provider === "garmin" ? false : prev.garminConnected
    }));
  };

  // Determine next workout from plan
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const nextWorkout = plan?.sessions.find(s => s.day === todayStr) || plan?.sessions[0];

  const apiNotice = apiStatus.state === "missing" || apiStatus.state === "invalid"
    ? {
        title: "Gemini API key issue",
        message: apiStatus.message || "Add a valid Gemini API key to enable AI-powered plans."
      }
    : undefined;

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView} notice={apiNotice}>
      {currentView === 'dashboard' && (
        <Dashboard 
            recentActivities={activities} 
            nextWorkout={nextWorkout} 
            integrations={integrations}
        />
      )}
      
      {currentView === 'training' && plan && (
        <TrainingView 
            plan={plan} 
            onUpdatePlan={setPlan} 
            activities={activities}
            integrations={integrations}
        />
      )}
      
      {currentView === 'nutrition' && (
        <NutritionView 
            today={nutrition} 
            onAddMeal={handleAddMeal}
            nutritionPlan={nutritionPlan}
            onSetNutritionPlan={setNutritionPlan}
        />
      )}

      {currentView === 'settings' && (
        <SettingsView
          user={user}
          integrations={integrations}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      )}
    </Layout>
  );
};

export default App;
