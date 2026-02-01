import React from 'react';
import { UserProfile } from '../types';

type IntegrationState = {
    connected: boolean;
    syncing: boolean;
    error?: string;
    lastSync?: string;
};

export const SettingsView = ({
    user,
    integrations,
    onConnect,
    onDisconnect
}: {
    user: UserProfile;
    integrations: { strava: IntegrationState; garmin: IntegrationState };
    onConnect: (provider: "strava" | "garmin") => void;
    onDisconnect: (provider: "strava" | "garmin") => void;
}) => {
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
                <h2 className="text-2xl font-bold text-white mb-6">Athlete Profile</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                        <input type="text" value={user.name} readOnly className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Target Race Distance (km)</label>
                            <input type="number" value={user.raceDistance} readOnly className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Fitness Level</label>
                            <input type="text" value={user.fitnessLevel} readOnly className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
                <h2 className="text-2xl font-bold text-white mb-6">Integrations</h2>
                
                <div className="flex items-center justify-between p-4 bg-[#fc4c02]/10 border border-[#fc4c02]/30 rounded-xl mb-4">
                    <div className="flex items-center space-x-4">
                        <div className="bg-[#fc4c02] p-2 rounded-lg">
                             <svg role="img" viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg"><title>Strava</title><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Strava</h3>
                            <p className="text-sm text-slate-400">Sync activities automatically</p>
                            {integrations.strava.error && (
                                <p className="text-xs text-orange-300 mt-1">{integrations.strava.error}</p>
                            )}
                        </div>
                    </div>
                    <button
                        className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg border border-slate-700"
                        onClick={() =>
                            user.stravaConnected ? onDisconnect("strava") : onConnect("strava")
                        }
                    >
                        {user.stravaConnected ? 'Disconnect' : 'Connect'}
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#000000]/20 border border-slate-700 rounded-xl">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white p-2 rounded-lg">
                             <span className="text-black font-bold text-xs">GARMIN</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Garmin Connect</h3>
                            <p className="text-sm text-slate-400">Sync activities and health metrics</p>
                            {integrations.garmin.error && (
                                <p className="text-xs text-orange-300 mt-1">{integrations.garmin.error}</p>
                            )}
                        </div>
                    </div>
                    <button
                        className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg border border-slate-700"
                        onClick={() =>
                            user.garminConnected ? onDisconnect("garmin") : onConnect("garmin")
                        }
                    >
                        {user.garminConnected ? 'Disconnect' : 'Connect'}
                    </button>
                </div>
            </div>
        </div>
    )
}
