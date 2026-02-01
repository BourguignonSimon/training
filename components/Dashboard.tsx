import React from 'react';
import { Activity } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Mountain, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface DashboardProps {
  recentActivities: Activity[];
  nextWorkout: any;
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

const StatCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      {sub && <span className="text-xs font-medium text-trail-400 bg-trail-400/10 px-2 py-1 rounded-full">{sub}</span>}
    </div>
    <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
    <p className="text-slate-400 text-sm">{label}</p>
  </div>
);

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-800/70 rounded ${className}`} />
);

export const Dashboard: React.FC<DashboardProps> = ({
  recentActivities,
  nextWorkout,
  integrations,
  activitiesLoading,
  planLoading,
  planError,
  onRefreshActivities,
  onRegeneratePlan
}) => {
  // Process data for charts
  const weeklyVolume = recentActivities.slice(0, 7).reduce((acc, curr) => acc + curr.distance, 0);
  const totalVert = recentActivities.slice(0, 7).reduce((acc, curr) => acc + curr.elevationGain, 0);

  const chartData = recentActivities.slice(0, 14).reverse().map(act => ({
    name: new Date(act.date).toLocaleDateString(undefined, { weekday: 'short' }),
    distance: act.distance,
    elevation: act.elevationGain
  }));

  const syncError = integrations.strava.error || integrations.garmin.error;
  const alertMessage = planError || syncError;
  const alertAction = planError ? onRegeneratePlan : onRefreshActivities;
  const alertLabel = planError ? "Retry plan" : "Retry sync";

  return (
    <div className="space-y-6">
      {alertMessage && (
        <div className="bg-orange-500/10 border border-orange-500/30 text-orange-200 text-sm rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Heads up</p>
            <p className="text-xs text-orange-200/80">{alertMessage}</p>
          </div>
          <button
            onClick={alertAction}
            className="text-xs font-semibold text-orange-100 bg-orange-500/20 hover:bg-orange-500/30 px-3 py-1 rounded-full"
          >
            {alertLabel}
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Coach Dashboard</h2>
          <p className="text-slate-400">Week 4 of 16 • 175km Race Prep</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {(["strava", "garmin"] as const).map((provider) => {
            const integration = integrations[provider];
            const label = provider === "strava" ? "Strava" : "Garmin";
            const statusText = integration.connected ? "Connected" : "Not Connected";
            return (
              <div
                key={provider}
                className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    integration.connected ? "bg-green-500" : "bg-slate-500"
                  } ${integration.syncing ? "animate-pulse" : ""}`}
                ></div>
                <span className="text-sm font-medium text-slate-300">
                  {label} {statusText}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activitiesLoading && recentActivities.length === 0 ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <SkeletonBlock className="h-10 w-10 mb-4" />
              <SkeletonBlock className="h-7 w-24 mb-2" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
          ))
        ) : (
          <>
            <StatCard 
              label="Last 7 Days Volume" 
              value={`${weeklyVolume.toFixed(1)} km`} 
              sub="+12%" 
              icon={TrendingUp} 
              color="bg-blue-500" 
            />
            <StatCard 
              label="Elevation Gain" 
              value={`${totalVert} m`} 
              sub="On Track" 
              icon={Mountain} 
              color="bg-purple-500" 
            />
            <StatCard 
              label="Avg Pace" 
              value="06:12 /km" 
              icon={Clock} 
              color="bg-orange-500" 
            />
            <StatCard 
              label="Training Adherence" 
              value="92%" 
              sub="High" 
              icon={CheckCircle2} 
              color="bg-trail-500" 
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-semibold mb-6">Activity Volume (Last 14 Days)</h3>
          <div className="h-64 w-full">
            {activitiesLoading && recentActivities.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center">
                <SkeletonBlock className="h-48 w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34ab76" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34ab76" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                      dataKey="name" 
                      stroke="#475569" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                  />
                  <YAxis 
                      stroke="#475569" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}km`}
                  />
                  <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                      type="monotone" 
                      dataKey="distance" 
                      stroke="#34ab76" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorDist)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Next Workout & Status */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Mountain size={100} />
             </div>
             <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wide mb-2">Up Next</h3>
             {planLoading ? (
               <div className="space-y-3">
                 <SkeletonBlock className="h-6 w-40" />
                 <SkeletonBlock className="h-10 w-32" />
                 <SkeletonBlock className="h-3 w-full" />
                 <SkeletonBlock className="h-10 w-full" />
               </div>
             ) : (
               <>
                 <h2 className="text-2xl font-bold text-white mb-2">{nextWorkout?.type || "Rest Day"}</h2>
                 <div className="text-4xl font-black text-trail-400 mb-4">
                    {nextWorkout?.distanceTarget} <span className="text-lg text-slate-400 font-normal">km</span>
                 </div>
                 <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    {nextWorkout?.description || "Take it easy and recover for the long run."}
                 </p>
                 <button className="w-full bg-trail-600 hover:bg-trail-500 text-white font-semibold py-3 rounded-xl transition-colors">
                    Start Activity
                 </button>
               </>
             )}
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
             <h3 className="text-lg font-semibold mb-4 flex items-center">
                <AlertCircle className="text-orange-400 mr-2" size={20} /> 
                Coach Insights
             </h3>
             <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 mr-2 shrink-0"></span>
                    Volume is slightly lower than plan this week (-5km).
                </li>
                <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-trail-400 rounded-full mt-1.5 mr-2 shrink-0"></span>
                    Great consistency on nutrition tracking.
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
