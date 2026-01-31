import React, { ReactNode } from 'react';
import { LayoutDashboard, Calendar, Utensils, Settings, Activity } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const NavItem = ({ 
  view, 
  current, 
  icon: Icon, 
  label, 
  onClick 
}: { 
  view: ViewState; 
  current: ViewState; 
  icon: any; 
  label: string; 
  onClick: (v: ViewState) => void 
}) => (
  <button
    onClick={() => onClick(view)}
    className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 ${
      current === view 
        ? 'bg-trail-600 text-white shadow-lg shadow-trail-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center space-x-2 mb-10">
          <Activity className="text-trail-500" size={32} />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-trail-400 to-trail-600 bg-clip-text text-transparent">
            UltraCoach
          </h1>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem view="dashboard" current={currentView} icon={LayoutDashboard} label="Dashboard" onClick={onNavigate} />
          <NavItem view="training" current={currentView} icon={Calendar} label="Training Plan" onClick={onNavigate} />
          <NavItem view="nutrition" current={currentView} icon={Utensils} label="Nutrition" onClick={onNavigate} />
          <NavItem view="settings" current={currentView} icon={Settings} label="Settings" onClick={onNavigate} />
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Race Day</p>
            <p className="font-bold text-lg">Aug 24, 2025</p>
            <p className="text-sm text-trail-400">175km - 10,000m D+</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative flex flex-col">
        {/* Mobile Header with Safe Area support */}
        <header className="md:hidden flex items-center justify-between p-4 pt-[env(safe-area-inset-top,1rem)] border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
            <div className="flex items-center space-x-2">
              <Activity className="text-trail-500" size={24} />
              <span className="font-bold tracking-tight">UltraCoach</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="text-xs font-bold text-trail-400">TR</span>
            </div>
        </header>
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full pb-[calc(80px+env(safe-area-inset-bottom,0px))] md:pb-8">
          {children}
        </div>

        {/* Mobile Bottom Nav with Safe Area support */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2 pb-[env(safe-area-inset-bottom,0.5rem)] flex justify-around z-30">
          <button 
            onClick={() => onNavigate('dashboard')} 
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'dashboard' ? 'text-trail-500' : 'text-slate-500'}`}
          >
            <LayoutDashboard size={22}/>
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </button>
          <button 
            onClick={() => onNavigate('training')} 
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'training' ? 'text-trail-500' : 'text-slate-500'}`}
          >
            <Calendar size={22}/>
            <span className="text-[10px] mt-1 font-medium">Plan</span>
          </button>
          <button 
            onClick={() => onNavigate('nutrition')} 
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'nutrition' ? 'text-trail-500' : 'text-slate-500'}`}
          >
            <Utensils size={22}/>
            <span className="text-[10px] mt-1 font-medium">Eats</span>
          </button>
          <button 
            onClick={() => onNavigate('settings')} 
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'settings' ? 'text-trail-500' : 'text-slate-500'}`}
          >
            <Settings size={22}/>
            <span className="text-[10px] mt-1 font-medium">More</span>
          </button>
        </div>
      </main>
    </div>
  );
};
