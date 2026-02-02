import React, { useState } from 'react';
import { Meal, MealType, NutritionDay, NutritionPlanDay, PlannedMeal, isMealType, isPlannedMeal } from '@/types';
import { analyzeNutrition, generateNutritionPlan } from '@/api/gemini';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Plus, Loader2, Utensils, Edit2, Wand2 } from 'lucide-react';

interface NutritionViewProps {
  today: NutritionDay;
  onAddMeal: (meal: Meal) => void;
  nutritionPlan: NutritionPlanDay[];
  onSetNutritionPlan: (plan: NutritionPlanDay[]) => void;
}

interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  color: string;
}

const MacroBar = ({ label, value, target, color }: MacroBarProps) => {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value} / {target}g</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`} 
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export const NutritionView: React.FC<NutritionViewProps> = ({ today, onAddMeal, nutritionPlan, onSetNutritionPlan }) => {
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [lastAnalysisInput, setLastAnalysisInput] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logger' | 'plan'>('logger');
  const [manualMode, setManualMode] = useState(false);
  const [manualMeal, setManualMeal] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0 });

  const runAnalysis = async (text: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setLastAnalysisInput(text);
    try {
      const meal = await analyzeNutrition(text);
      onAddMeal(meal);
      setInput("");
    } catch (error) {
      console.error("Nutrition analysis failed", error);
      setAnalysisError("We couldn't analyze that meal. Please try again or switch to manual entry.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await runAnalysis(input);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMeal({
        ...manualMeal,
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'Snack' // Default
    });
    setManualMeal({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0 });
    setManualMode(false);
  };

  const handleGeneratePlan = async () => {
      setIsGeneratingPlan(true);
      setPlanError(null);
      try {
        const plan = await generateNutritionPlan("Endurance and Recovery");
        onSetNutritionPlan(plan);
      } catch (error) {
        console.error("Nutrition plan generation failed", error);
        setPlanError("We couldn't generate a nutrition plan. Try again in a moment.");
      } finally {
        setIsGeneratingPlan(false);
      }
  };

  const addPlannedMeal = (plannedMeal: PlannedMeal, type: MealType) => {
      if (!isPlannedMeal(plannedMeal) || !isMealType(type)) {
          return;
      }
      onAddMeal({
          id: Date.now().toString(),
          name: plannedMeal.name,
          calories: plannedMeal.calories,
          protein: plannedMeal.macros.p,
          carbs: plannedMeal.macros.c,
          fats: plannedMeal.macros.f,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type
      });
      setActiveTab('logger');
  };

  const currentCals = today.meals.reduce((acc, m) => acc + m.calories, 0);
  const currentPro = today.meals.reduce((acc, m) => acc + m.protein, 0);
  const currentCarb = today.meals.reduce((acc, m) => acc + m.carbs, 0);
  const currentFat = today.meals.reduce((acc, m) => acc + m.fats, 0);

  const pieData = [
    { name: 'Protein', value: currentPro * 4, color: '#3b82f6' },
    { name: 'Carbs', value: currentCarb * 4, color: '#22c55e' },
    { name: 'Fats', value: currentFat * 9, color: '#eab308' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Logger / Plan Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
            <button 
                onClick={() => setActiveTab('logger')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'logger' ? 'bg-trail-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                Daily Log
            </button>
            <button 
                onClick={() => setActiveTab('plan')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'plan' ? 'bg-trail-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                Smart Plan
            </button>
        </div>

        {activeTab === 'logger' ? (
            <>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <Utensils className="mr-2 text-trail-500" /> 
                            Log Meal
                        </h2>
                        <button onClick={() => setManualMode(!manualMode)} className="text-sm text-trail-400 hover:text-trail-300">
                            {manualMode ? 'Switch to AI Analysis' : 'Switch to Manual Entry'}
                        </button>
                    </div>

                    {manualMode ? (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase">Food Name</label>
                                <input required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" value={manualMeal.name} onChange={e => setManualMeal({...manualMeal, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase">Kcal</label>
                                    <input type="number" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" value={manualMeal.calories} onChange={e => setManualMeal({...manualMeal, calories: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase">Prot (g)</label>
                                    <input type="number" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" value={manualMeal.protein} onChange={e => setManualMeal({...manualMeal, protein: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase">Carb (g)</label>
                                    <input type="number" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" value={manualMeal.carbs} onChange={e => setManualMeal({...manualMeal, carbs: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase">Fat (g)</label>
                                    <input type="number" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" value={manualMeal.fats} onChange={e => setManualMeal({...manualMeal, fats: Number(e.target.value)})} />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-trail-600 hover:bg-trail-500 text-white p-2 rounded-lg font-medium">Add Meal</button>
                        </form>
                    ) : (
                        <form onSubmit={handleAnalyze} className="relative">
                            <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="e.g. I had a bowl of oatmeal with banana and a scoop of protein powder..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-trail-500 focus:border-transparent outline-none resize-none h-32"
                            />
                            <button 
                            type="submit" 
                            disabled={isAnalyzing || !input.trim()}
                            className="absolute bottom-4 right-4 bg-trail-600 hover:bg-trail-500 text-white px-4 py-2 rounded-lg font-medium flex items-center disabled:opacity-50 transition-colors"
                            >
                            {isAnalyzing ? (
                                <>
                                <Loader2 className="animate-spin mr-2" size={18} />
                                Analyzing...
                                </>
                            ) : (
                                <>
                                <Plus size={18} className="mr-2" />
                                Log Meal
                                </>
                            )}
                            </button>
                        </form>
                    )}
                    {analysisError && (
                        <div className="mt-4 bg-orange-500/10 border border-orange-500/30 text-orange-200 text-sm rounded-xl p-3 flex items-center justify-between gap-3">
                            <span>{analysisError}</span>
                            <button
                              type="button"
                              onClick={() => lastAnalysisInput && runAnalysis(lastAnalysisInput)}
                              className="text-xs font-semibold text-orange-100 bg-orange-500/20 hover:bg-orange-500/30 px-3 py-1 rounded-full"
                            >
                              Retry
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white px-1">Today's Log</h3>
                    {today.meals.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                            No meals logged today yet.
                        </div>
                    ) : (
                        today.meals.slice().reverse().map((meal) => (
                            <div key={meal.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-white font-medium">{meal.name}</span>
                                        <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800 rounded-full">{meal.type}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 space-x-3">
                                        <span>{meal.calories} kcal</span>
                                        <span className="text-blue-400">{meal.protein}g P</span>
                                        <span className="text-green-400">{meal.carbs}g C</span>
                                        <span className="text-yellow-400">{meal.fats}g F</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-sm text-slate-500 font-mono">
                                        {meal.time}
                                    </div>
                                    <button className="text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </>
        ) : (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Suggested Nutrition</h2>
                        <p className="text-slate-400 text-sm">AI-generated based on your training block</p>
                    </div>
                    <button 
                        onClick={handleGeneratePlan}
                        disabled={isGeneratingPlan}
                        className="bg-trail-600 hover:bg-trail-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center disabled:opacity-50"
                    >
                        {isGeneratingPlan ? <Loader2 className="animate-spin mr-2" size={16}/> : <Wand2 className="mr-2" size={16} />}
                        {nutritionPlan.length > 0 ? 'Regenerate' : 'Generate Plan'}
                    </button>
                </div>
                {planError && (
                    <div className="mb-4 bg-orange-500/10 border border-orange-500/30 text-orange-200 text-sm rounded-xl p-3 flex items-center justify-between gap-3">
                        <span>{planError}</span>
                        <button
                          type="button"
                          onClick={handleGeneratePlan}
                          className="text-xs font-semibold text-orange-100 bg-orange-500/20 hover:bg-orange-500/30 px-3 py-1 rounded-full"
                        >
                          Retry
                        </button>
                    </div>
                )}
                
                {nutritionPlan.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <Wand2 size={48} className="mb-4 opacity-20" />
                        <p>No plan generated yet. Ask AI to create one.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                         {nutritionPlan.map((day, idx) => {
                             const mealEntries = Object.entries(day.meals) as [MealType, PlannedMeal][];
                             return (
                                 <div key={idx} className="border-b border-slate-800 last:border-0 pb-6 last:pb-0">
                                    <h3 className="font-bold text-trail-400 mb-3">{day.day}</h3>
                                    <div className="space-y-3">
                                        {mealEntries.map(([type, meal]) => (
                                            <div key={type} className="bg-slate-950 p-3 rounded-lg flex justify-between items-center border border-slate-800">
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs font-bold text-slate-500 uppercase w-20">{type}</span>
                                                        <span className="text-white font-medium">{meal.name}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 ml-[88px]">
                                                        {meal.calories} kcal • {meal.macros.c}g C
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => addPlannedMeal(meal, type)}
                                                    className="text-trail-500 hover:text-trail-400 hover:bg-trail-900/20 p-2 rounded-full transition-colors"
                                                    title="Add to Daily Log"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                 </div>
                             );
                         })}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Stats Column */}
      <div className="space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6">Daily Targets</h3>
            
            <div className="mb-8 text-center">
                <div className="text-4xl font-black text-white mb-1">{currentCals}</div>
                <div className="text-sm text-slate-400">kcal consumed / {today.targets.calories} target</div>
            </div>

            <MacroBar label="Protein" value={currentPro} target={today.targets.protein} color="bg-blue-500" />
            <MacroBar label="Carbs" value={currentCarb} target={today.targets.carbs} color="bg-green-500" />
            <MacroBar label="Fats" value={currentFat} target={today.targets.fats} color="bg-yellow-500" />
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-64">
            <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase">Calorie Breakdown</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData.length > 0 ? pieData : [{name:'Empty', value:1}]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {pieData.length > 0 ? pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        )) : <Cell fill="#334155" />}
                    </Pie>
                    <Tooltip contentStyle={{background: '#0f172a', border: 'none', borderRadius: '8px'}} itemStyle={{color:'white'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', color: '#94a3b8'}}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
