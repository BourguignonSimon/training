// Server-side AI integration - no direct Gemini calls from client
// Cookies are sent automatically by the browser via the proxy

import { WeeklyPlan, Meal, NutritionPlanDay, isMealInput } from "@/types";

export interface UserProfile {
  level?: string;
  weeklyHours?: number;
  goals?: string[];
  currentFitness?: string;
  targetRace?: string;
  targetDate?: string;
  weeksToRace?: number;
  currentWeekStart?: string;
}

const getDatesForWeek = () => {
  const dates = [];
  const today = new Date();
  const currentDay = today.getDay();
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(diff + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

export const getFallbackTrainingPlan = (): WeeklyPlan => {
  const dates = getDatesForWeek();
  return {
    weekNumber: 1,
    focus: "Base Building & Aerobic Capacity",
    sessions: [
      {
        day: "Monday",
        date: dates[0],
        type: "Rest",
        distanceTarget: 0,
        description: "Active recovery or total rest.",
      },
      {
        day: "Tuesday",
        date: dates[1],
        type: "Easy",
        distanceTarget: 10,
        description: "Zone 2 flat trail run.",
      },
      {
        day: "Wednesday",
        date: dates[2],
        type: "Hill Repeats",
        distanceTarget: 8,
        description: "10x3min hills @ threshold.",
      },
      {
        day: "Thursday",
        date: dates[3],
        type: "Easy",
        distanceTarget: 10,
        description: "Recovery run, keep HR low.",
      },
      {
        day: "Friday",
        date: dates[4],
        type: "Rest",
        distanceTarget: 0,
        description: "Mobility work.",
      },
      {
        day: "Saturday",
        date: dates[5],
        type: "Long Run",
        distanceTarget: 25,
        description: "Trail run with 1000m+ elevation gain.",
      },
      {
        day: "Sunday",
        date: dates[6],
        type: "Easy",
        distanceTarget: 15,
        description: "Back-to-back run on tired legs.",
      },
    ],
  };
};

/**
 * Fetch AI-generated training plan from the backend
 * The backend handles Gemini API calls securely
 */
export const fetchAiTrainingPlan = async (
  userProfile: UserProfile
): Promise<WeeklyPlan> => {
  try {
    const response = await fetch("/api/ai/generate-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Send cookies for authentication
      body: JSON.stringify(userProfile),
    });

    if (!response.ok) {
      throw new Error("Failed to generate training plan");
    }

    return response.json();
  } catch (error) {
    console.error("Training Plan API Error:", error);
    return getFallbackTrainingPlan();
  }
};

/**
 * Generate training plan (wrapper for backward compatibility)
 */
export const generateTrainingPlan = async (
  weeksToRace: number,
  fitnessLevel: string,
  currentWeekStart: string
): Promise<WeeklyPlan> => {
  return fetchAiTrainingPlan({
    weeksToRace,
    level: fitnessLevel,
    currentWeekStart,
    targetRace: "175km ultra-trail",
  });
};

/**
 * Validate API connectivity (checks backend health)
 */
export const validateApiConnection = async (): Promise<{
  status: "valid" | "unavailable";
  message?: string;
}> => {
  try {
    const response = await fetch("/api/ai/generate-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ level: "test" }),
    });

    if (response.ok) {
      return { status: "valid" };
    }

    return {
      status: "unavailable",
      message: "AI service is temporarily unavailable",
    };
  } catch {
    return {
      status: "unavailable",
      message: "Cannot connect to the server. Check your network connection.",
    };
  }
};

/**
 * Generate nutrition plan via backend
 */
export const generateNutritionPlan = async (
  focus: string
): Promise<NutritionPlanDay[]> => {
  try {
    const response = await fetch("/api/ai/nutrition-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ focus }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate nutrition plan");
    }

    return response.json();
  } catch {
    // Fallback nutrition plan
    return [
      {
        day: "Training Day",
        meals: {
          Breakfast: {
            name: "Oatmeal Power",
            description: "Oats with berries and honey",
            calories: 450,
            macros: { p: 15, c: 70, f: 10 },
          },
          Lunch: {
            name: "Chicken Quinoa",
            description: "Grilled chicken bowl",
            calories: 600,
            macros: { p: 40, c: 60, f: 20 },
          },
          Dinner: {
            name: "Salmon & Sweet Potato",
            description: "Baked salmon with steamed veggies",
            calories: 550,
            macros: { p: 35, c: 40, f: 25 },
          },
          Snack: {
            name: "Trail Mix",
            description: "Nuts and dried fruits",
            calories: 300,
            macros: { p: 8, c: 30, f: 18 },
          },
        },
      },
    ];
  }
};

/**
 * Analyze nutrition via backend
 */
export const analyzeNutrition = async (foodLog: string): Promise<Meal> => {
  try {
    const response = await fetch("/api/ai/analyze-nutrition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ foodLog }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze nutrition");
    }

    const data = await response.json();
    if (!isMealInput(data)) {
      throw new Error("Invalid meal response");
    }

    return {
      ...data,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch {
    return {
      id: Date.now().toString(),
      name: "Logged Item (Offline)",
      calories: 300,
      protein: 10,
      carbs: 40,
      fats: 10,
      time: "12:00",
      type: "Snack",
    };
  }
};

/**
 * Get coach advice via backend
 */
export const getCoachAdvice = async (
  query: string,
  context: string
): Promise<string> => {
  try {
    const response = await fetch("/api/ai/coach-advice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ query, context }),
    });

    if (!response.ok) {
      throw new Error("Failed to get coach advice");
    }

    const data = await response.json();
    return data.advice || "I'm focusing on the trail right now, ask me again later.";
  } catch {
    return "Network error. Even coaches lose signal in the mountains sometimes.";
  }
};
