import { Activity } from "../types";

// Helper to generate fake data for charts
export const generateMockActivities = (): Activity[] => {
  const activities: Activity[] = [];
  const today = new Date();
  
  // Generate last 30 days of data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Randomly decide if run happened (rest days)
    if (Math.random() > 0.3) {
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseDistance = isWeekend ? 15 : 8;
      const randomVar = Math.random() * 5;
      const distance = Math.round((baseDistance + randomVar) * 10) / 10;
      
      activities.push({
        id: `act-${i}`,
        name: isWeekend ? "Long Trail Run" : "Morning Run",
        type: 'Run',
        distance: distance,
        duration: distance * 6, // approx 6min/km
        elevationGain: isWeekend ? distance * 30 : distance * 10,
        date: date.toISOString().split('T')[0],
        calories: distance * 60
      });
    }
  }
  return activities;
};

export const MOCK_ACTIVITIES = generateMockActivities();