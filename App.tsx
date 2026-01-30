import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TrainingView } from './components/TrainingView';
import { NutritionView } from './components/NutritionView';
import { SettingsView } from './components/SettingsView';
import { ViewState, WeeklyPlan, NutritionDay, Activity, UserProfile, NutritionPlanDay } from './types';
import { generateTrainingPlan } from './services/gemini';
import { MOCK_ACTIVITIES } from './services/strava';

const INITIAL_USER: UserProfile = {
  name: "Trail Runner",
  raceDistance: 175,
  raceDate: "2025-08-24",
  stravaConnected: true,
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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [nutrition, setNutrition] = useState<NutritionDay>(INITIAL_NUTRITION);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlanDay[]>([]);
  
  useEffect(() => {
    const fetchPlan = async () => {
      // In a real app, check if we have this week stored, else generate
      const newPlan = await generateTrainingPlan(16, 'Advanced', new Date().toISOString().split('T')[0]);
      setPlan(newPlan);
    };
    fetchPlan();
  }, []);

  const handleAddMeal = (meal: any) => {
    setNutrition(prev => ({
      ...prev,
      meals: [...prev.meals, meal]
    }));
  };

  // Determine next workout from plan
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const nextWorkout = plan?.sessions.find(s => s.day === todayStr) || plan?.sessions[0];

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'dashboard' && (
        <Dashboard 
            recentActivities={activities} 
            nextWorkout={nextWorkout} 
            weeklyPlan={plan || undefined}
        />
      )}
      
      {currentView === 'training' && plan && (
        <TrainingView 
            plan={plan} 
            onUpdatePlan={setPlan} 
            activities={activities}
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
        <SettingsView user={INITIAL_USER} />
      )}
    </Layout>
  );
};

export default App;