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
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
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
      <main className="flex-1 overflow-auto relative">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
            <div className="flex items-center space-x-2">
              <Activity className="text-trail-500" size={24} />
              <span className="font-bold">UltraCoach</span>
            </div>
        </header>
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-2 flex justify-around z-30">
          <button onClick={() => onNavigate('dashboard')} className={`p-3 rounded-lg ${currentView === 'dashboard' ? 'text-trail-500' : 'text-slate-500'}`}><LayoutDashboard size={24}/></button>
          <button onClick={() => onNavigate('training')} className={`p-3 rounded-lg ${currentView === 'training' ? 'text-trail-500' : 'text-slate-500'}`}><Calendar size={24}/></button>
          <button onClick={() => onNavigate('nutrition')} className={`p-3 rounded-lg ${currentView === 'nutrition' ? 'text-trail-500' : 'text-slate-500'}`}><Utensils size={24}/></button>
          <button onClick={() => onNavigate('settings')} className={`p-3 rounded-lg ${currentView === 'settings' ? 'text-trail-500' : 'text-slate-500'}`}><Settings size={24}/></button>
        </div>
      </main>
    </div>
  );
};