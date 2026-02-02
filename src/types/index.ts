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

export type MealType = Meal['type'];

export type MealInput = Omit<Meal, 'id' | 'time'>;

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isMealType = (value: unknown): value is MealType =>
  value === 'Breakfast' || value === 'Lunch' || value === 'Dinner' || value === 'Snack';

export const isMealInput = (value: unknown): value is MealInput => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.name === 'string' &&
    typeof value.calories === 'number' &&
    typeof value.protein === 'number' &&
    typeof value.carbs === 'number' &&
    typeof value.fats === 'number' &&
    isMealType(value.type)
  );
};

export const isMeal = (value: unknown): value is Meal => {
  if (!isMealInput(value) || !isRecord(value)) {
    return false;
  }
  return typeof value.id === 'string' && typeof value.time === 'string';
};

export const isPlannedMeal = (value: unknown): value is PlannedMeal => {
  if (!isRecord(value)) {
    return false;
  }
  const macros = value.macros;
  return (
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.calories === 'number' &&
    isRecord(macros) &&
    typeof macros.p === 'number' &&
    typeof macros.c === 'number' &&
    typeof macros.f === 'number'
  );
};
