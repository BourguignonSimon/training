export interface Activity {
  id: string;
  name: string;
  type: 'Run' | 'TrailRun' | 'Hike' | 'Rest';
  distance: number; // km
  duration: number; // minutes
  elevationGain: number; // meters
  date: string; // ISO date
  calories: number;
}

export interface TrainingSession {
  day: string; // "Monday", etc.
  date: string;
  type: 'Rest' | 'Easy' | 'Tempo' | 'Intervals' | 'Long Run' | 'Hill Repeats' | 'Cross Train';
  distanceTarget: number; // km
  description: string;
  completed?: boolean;
  actualDistance?: number;
}

export interface WeeklyPlan {
  weekNumber: number;
  focus: string;
  sessions: TrainingSession[];
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
}

export interface PlannedMeal {
    name: string;
    description: string;
    calories: number;
    macros: { p: number, c: number, f: number };
}

export interface NutritionPlanDay {
    day: string;
    meals: {
        Breakfast: PlannedMeal;
        Lunch: PlannedMeal;
        Dinner: PlannedMeal;
        Snack: PlannedMeal;
    };
}

export interface NutritionDay {
  date: string;
  meals: Meal[];
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export type ViewState = 'dashboard' | 'training' | 'nutrition' | 'settings';

export interface UserProfile {
  name: string;
  raceDistance: number;
  raceDate: string;
  stravaConnected: boolean;
  garminConnected: boolean;
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
}