
import React from 'react';
import DashboardCard from '../../../shared/ui/card';

const CameraPlaceholder = ({ name }: { name: string }) => (
    <div className="bg-zinc-900 rounded-2xl aspect-video flex flex-col justify-center items-center border border-zinc-700 p-6 space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/40 via-transparent to-transparent opacity-50"></div>
        <div className="relative z-10 flex flex-col justify-center items-center space-y-4">
             <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h10.5a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0015 5.25H4.5A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
                </svg>
                <div className="absolute inset-0 -m-2 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p className="text-gray-400 text-center font-semibold">{name}</p>
            <p className="text-gray-500 text-center text-sm max-w-xs">
                Please connect to the cloud to view the camera video
            </p>
            <button className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-full hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-emerald-500">
                Okay
            </button>
        </div>
    </div>
);


const CameraPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-semibold text-white">Classroom Cameras</h1>
                <p className="text-gray-400 mt-1">Live feeds from classrooms and common areas.</p>
            </div>

            <div className="max-w-5xl mx-auto">
                <DashboardCard title="Live Feeds">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CameraPlaceholder name="Classroom 101" />
                        <CameraPlaceholder name="Classroom 204" />
                        <CameraPlaceholder name="Library" />
                        <CameraPlaceholder name="Cafeteria" />
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
};

export default CameraPage;