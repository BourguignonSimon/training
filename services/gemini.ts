import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyPlan, Meal, NutritionPlanDay } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// System instruction for the coach persona
const COACH_SYSTEM_INSTRUCTION = `You are an elite ultra-trail running coach specializing in 100-mile (175km) races. 
You provide scientific, data-driven training plans and nutrition advice. 
You are encouraging but realistic about the difficulty of the event.
Always respond with structured JSON when requested.`;

const getDatesForWeek = () => {
  const dates = [];
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust when day is Sunday
  
  for(let i=0; i<7; i++) {
    const d = new Date(today);
    d.setDate(diff + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export const generateTrainingPlan = async (
  weeksToRace: number, 
  fitnessLevel: string,
  currentWeekStart: string
): Promise<WeeklyPlan> => {
  const model = 'gemini-3-flash-preview';

  const prompt = `Create a 1-week detailed training plan for a runner preparing for a 175km trail race.
  This is week ${16 - weeksToRace + 1} of a 16 week block.
  Fitness Level: ${fitnessLevel}.
  Week Start Date: ${currentWeekStart}.
  
  Focus on specific trail specifics like vert, back-to-back long runs, and recovery.
  
  Return ONLY JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: COACH_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weekNumber: { type: Type.INTEGER },
            focus: { type: Type.STRING },
            sessions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  date: { type: Type.STRING },
                  type: { type: Type.STRING },
                  distanceTarget: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as WeeklyPlan;
    }
    throw new Error("No text response from Gemini");
  } catch (error) {
    console.error("Gemini Training Plan Error:", error);
    const dates = getDatesForWeek();
    return {
      weekNumber: 1,
      focus: "Base Building & Aerobic Capacity",
      sessions: [
        { day: "Monday", date: dates[0], type: "Rest", distanceTarget: 0, description: "Active recovery or total rest." },
        { day: "Tuesday", date: dates[1], type: "Easy", distanceTarget: 10, description: "Zone 2 flat trail run." },
        { day: "Wednesday", date: dates[2], type: "Hill Repeats", distanceTarget: 8, description: "10x3min hills @ threshold." },
        { day: "Thursday", date: dates[3], type: "Easy", distanceTarget: 10, description: "Recovery run, keep HR low." },
        { day: "Friday", date: dates[4], type: "Rest", distanceTarget: 0, description: "Mobility work." },
        { day: "Saturday", date: dates[5], type: "Long Run", distanceTarget: 25, description: "Trail run with 1000m+ elevation gain." },
        { day: "Sunday", date: dates[6], type: "Easy", distanceTarget: 15, description: "Back-to-back run on tired legs." }
      ]
    };
  }
};

export const generateNutritionPlan = async (focus: string): Promise<NutritionPlanDay[]> => {
    const model = 'gemini-3-flash-preview';
    const prompt = `Create a 3-day sample nutrition plan for a trail runner. Training focus: ${focus}. Return JSON.`;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: "You are a sports nutritionist. Provide high carb meals for endurance.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.STRING },
                            meals: {
                                type: Type.OBJECT,
                                properties: {
                                    Breakfast: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, description: {type: Type.STRING}, calories: {type: Type.NUMBER}, macros: { type: Type.OBJECT, properties: { p: {type:Type.NUMBER}, c:{type:Type.NUMBER}, f:{type:Type.NUMBER} }} } },
                                    Lunch: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, description: {type: Type.STRING}, calories: {type: Type.NUMBER}, macros: { type: Type.OBJECT, properties: { p: {type:Type.NUMBER}, c:{type:Type.NUMBER}, f:{type:Type.NUMBER} }} } },
                                    Dinner: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, description: {type: Type.STRING}, calories: {type: Type.NUMBER}, macros: { type: Type.OBJECT, properties: { p: {type:Type.NUMBER}, c:{type:Type.NUMBER}, f:{type:Type.NUMBER} }} } },
                                    Snack: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, description: {type: Type.STRING}, calories: {type: Type.NUMBER}, macros: { type: Type.OBJECT, properties: { p: {type:Type.NUMBER}, c:{type:Type.NUMBER}, f:{type:Type.NUMBER} }} } },
                                }
                            }
                        }
                    }
                }
            }
        });
        if(response.text) return JSON.parse(response.text);
        throw new Error("No data");
    } catch (e) {
        return [
            {
                day: "Training Day",
                meals: {
                    Breakfast: { name: "Oatmeal Power", description: "Oats with berries and honey", calories: 450, macros: { p: 15, c: 70, f: 10 }},
                    Lunch: { name: "Chicken Quinoa", description: "Grilled chicken bowl", calories: 600, macros: { p: 40, c: 60, f: 20 }},
                    Dinner: { name: "Salmon & Sweet Potato", description: "Baked salmon with steamed veggies", calories: 550, macros: { p: 35, c: 40, f: 25 }},
                    Snack: { name: "Trail Mix", description: "Nuts and dried fruits", calories: 300, macros: { p: 8, c: 30, f: 18 }}
                }
            }
        ]
    }
}

export const analyzeNutrition = async (foodLog: string): Promise<Meal> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Analyze this food entry: "${foodLog}". Estimate calories and macros.
  Return JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "You are a sports nutritionist. Estimate nutritional values for trail runners accurately.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.INTEGER },
            protein: { type: Type.INTEGER },
            carbs: { type: Type.INTEGER },
            fats: { type: Type.INTEGER },
            type: { type: Type.STRING, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        ...data,
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
    throw new Error("No data");
  } catch (error) {
    console.error("Gemini Nutrition Error", error);
    return {
      id: Date.now().toString(),
      name: "Logged Item (Offline)",
      calories: 300,
      protein: 10,
      carbs: 40,
      fats: 10,
      time: "12:00",
      type: "Snack"
    };
  }
};

export const getCoachAdvice = async (query: string, context: string): Promise<string> => {
    const model = 'gemini-3-flash-preview';
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Context: ${context}. User Query: ${query}`,
            config: {
                systemInstruction: COACH_SYSTEM_INSTRUCTION,
            }
        });
        return response.text || "I'm focusing on the trail right now, ask me again later.";
    } catch (e) {
        return "Network error. Even coaches lose signal in the mountains sometimes.";
    }
}
