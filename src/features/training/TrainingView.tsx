import React, { useState } from 'react';
import { WeeklyPlan, TrainingSession, Activity } from '@/types';
import { MessageSquare, Plus, RefreshCw, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { getCoachAdvice } from '@/api/gemini';

interface TrainingViewProps {
  plan: WeeklyPlan | null;
  activities: Activity[];
  integrations: {
    strava: { connected: boolean; syncing: boolean; error?: string };
    garmin: { connected: boolean; syncing: boolean; error?: string };
  };
  activitiesLoading: boolean;
  planLoading: boolean;
  planError?: string;
  onRefreshActivities: () => void;
  onRegeneratePlan: () => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({
  plan,
  activities,
  integrations,
  activitiesLoading,
  planLoading,
  planError,
  onRefreshActivities,
  onRegeneratePlan
}) => {
  const [selectedDay, setSelectedDay] = useState<TrainingSession | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'coach', text: string}[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  const sendCoachMessage = async (message: string) => {
    if (!plan) {
      return;
    }
    setIsLoadingChat(true);
    setChatError(null);
    setLastPrompt(message);
    try {
      const context = `Current plan focus: ${plan.focus}. Selected day: ${selectedDay ? selectedDay.day : 'None'}.`;
      const response = await getCoachAdvice(message, context);
      setChatHistory(prev => [...prev, { role: 'coach', text: response }]);
    } catch (error) {
      console.error("Failed to fetch coach advice", error);
      setChatError("We couldn't reach Coach Gemini. Check your connection and try again.");
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !plan) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    await sendCoachMessage(userMsg);
  };

  const getStatusColor = (target: number, actual: number) => {
      if (target === 0) return 'text-slate-500'; // Rest day
      const pct = actual / target;
      if (pct >= 0.9) return 'text-trail-500';
      if (pct >= 0.5) return 'text-orange-400';
      return 'text-red-400';
  };

  const getMatchedActivity = (date: string) => {
      // Simple date matching, normally would check IDs or time ranges
      return activities.find(a => a.date === date);
  }

  if (planLoading || !plan) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        <div className="lg:col-span-2 flex flex-col space-y-4 h-full">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 animate-pulse">
            <div className="h-5 w-40 bg-slate-800 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-800 rounded" />
          </div>
          <div className="flex-1 space-y-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 w-32 bg-slate-800 rounded mb-2" />
                <div className="h-3 w-5/6 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
          <div className="h-4 w-24 bg-slate-800 rounded mb-4" />
          <div className="h-3 w-full bg-slate-800 rounded mb-2" />
          <div className="h-3 w-3/4 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Schedule Column */}
      <div className="lg:col-span-2 flex flex-col space-y-4 h-full overflow-hidden">
        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Week {plan.weekNumber}</h2>
            <p className="text-trail-400 text-sm">{plan.focus}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs text-slate-400 flex items-center">
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    integrations.strava.connected || integrations.garmin.connected
                      ? "bg-green-500"
                      : "bg-slate-500"
                  } ${integrations.strava.syncing || integrations.garmin.syncing ? "animate-pulse" : ""}`}
                ></span>
                {integrations.strava.syncing || integrations.garmin.syncing
                  ? "Syncing activities"
                  : "Activity sync idle"}
             </div>
             <button
                onClick={onRefreshActivities}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                aria-label="Refresh activities"
             >
                <RefreshCw size={20} />
             </button>
          </div>
        </div>

        {(planError || integrations.strava.error || integrations.garmin.error) && (
          <div className="bg-orange-500/10 border border-orange-500/30 text-orange-200 text-sm rounded-xl p-3 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">Sync warning</p>
              <p className="text-xs text-orange-200/80">
                {planError || integrations.strava.error || integrations.garmin.error}
              </p>
            </div>
            <button
              onClick={planError ? onRegeneratePlan : onRefreshActivities}
              className="text-xs font-semibold text-orange-100 bg-orange-500/20 hover:bg-orange-500/30 px-3 py-1 rounded-full"
            >
              {planError ? "Retry plan" : "Retry sync"}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {activitiesLoading && activities.length === 0 && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
                  <div className="h-4 w-24 bg-slate-800 rounded mb-2" />
                  <div className="h-3 w-3/4 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          )}
          {plan.sessions.map((session, idx) => {
            const matchedActivity = getMatchedActivity(session.date);
            const actualDist = matchedActivity ? matchedActivity.distance : 0;
            const isRest = session.type === 'Rest';
            
            return (
                <div 
                key={idx}
                onClick={() => setSelectedDay(session)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedDay === session 
                    ? 'bg-trail-900/20 border-trail-500/50' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
                >
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-3">
                    <span className="text-slate-400 w-24 font-medium">{session.day}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        isRest ? 'bg-slate-800 text-slate-400' : 
                        session.type === 'Long Run' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-trail-500/20 text-trail-400'
                    }`}>
                        {session.type}
                    </span>
                    </div>
                    {session.distanceTarget > 0 ? (
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="text-slate-500">Target: {session.distanceTarget}km</span>
                            {matchedActivity && (
                                <>
                                    <span className="text-slate-600">|</span>
                                    <span className={`font-bold ${getStatusColor(session.distanceTarget, actualDist)}`}>
                                        {actualDist}km
                                    </span>
                                    {actualDist >= session.distanceTarget * 0.9 ? (
                                        <CheckCircle size={14} className="text-trail-500" />
                                    ) : (
                                        <AlertTriangle size={14} className="text-orange-400" />
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <span className="text-slate-500 text-sm">Recovery</span>
                    )}
                </div>
                <div className="flex justify-between items-start ml-[108px]">
                     <p className="text-slate-400 text-sm flex-1">{session.description}</p>
                     {matchedActivity && (
                        <div className="text-xs text-slate-500 ml-4 bg-slate-800 px-2 py-1 rounded">
                             Activity: {matchedActivity.name}
                        </div>
                     )}
                </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* Details & Chat Column */}
      <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-full">
        {selectedDay ? (
          <div className="p-6 border-b border-slate-800 bg-slate-800/30">
            <h3 className="text-lg font-bold text-white mb-1">{selectedDay.day} Details</h3>
            <p className="text-trail-400 font-medium mb-4">{selectedDay.type} • {selectedDay.distanceTarget} km</p>
            <p className="text-slate-300 text-sm leading-relaxed">{selectedDay.description}</p>
            
            {getMatchedActivity(selectedDay.date) && (
                 <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Synced Activity</h4>
                    <div className="flex justify-between text-sm">
                        <span className="text-white">{getMatchedActivity(selectedDay.date)?.name}</span>
                        <span className="text-trail-400">{getMatchedActivity(selectedDay.date)?.distance} km</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>{getMatchedActivity(selectedDay.date)?.elevationGain}m D+</span>
                        <span>{Math.round(getMatchedActivity(selectedDay.date)?.duration || 0)} min</span>
                    </div>
                </div>
            )}
            
            <div className="mt-6 flex space-x-2">
                <button className="flex-1 border border-slate-600 text-slate-300 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors">Edit Plan</button>
            </div>
          </div>
        ) : (
          <div className="p-6 border-b border-slate-800 bg-slate-800/30 flex flex-col items-center justify-center text-center h-48">
             <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-3">
                <ChevronRight size={24} />
             </div>
             <p className="text-slate-400 text-sm">Select a training day to view details</p>
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col bg-slate-950">
            <div className="p-3 border-b border-slate-800 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-trail-500"></div>
                <span className="text-xs font-bold text-slate-400 uppercase">Coach Gemini</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 && (
                    <div className="text-center mt-10 opacity-50">
                        <MessageSquare className="mx-auto mb-2" size={24} />
                        <p className="text-xs">Ask specifically about your {selectedDay?.type || 'training'}...</p>
                    </div>
                )}
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                            msg.role === 'user' 
                            ? 'bg-trail-600 text-white rounded-tr-none' 
                            : 'bg-slate-800 text-slate-200 rounded-tl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoadingChat && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-3 rounded-lg rounded-tl-none">
                             <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                             </div>
                        </div>
                    </div>
                )}
                {chatError && (
                  <div className="bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs rounded-lg p-3 flex items-center justify-between gap-3">
                    <span>{chatError}</span>
                    <button
                      type="button"
                      onClick={() => lastPrompt && sendCoachMessage(lastPrompt)}
                      className="text-orange-100 bg-orange-500/20 hover:bg-orange-500/30 px-3 py-1 rounded-full text-xs font-semibold"
                    >
                      Retry
                    </button>
                  </div>
                )}
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-800 flex gap-2">
                <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about your workout..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-trail-500 text-white"
                />
                <button type="submit" disabled={isLoadingChat} className="bg-trail-600 text-white p-2 rounded-lg hover:bg-trail-500 disabled:opacity-50">
                    <Plus size={20} className="rotate-90" />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
