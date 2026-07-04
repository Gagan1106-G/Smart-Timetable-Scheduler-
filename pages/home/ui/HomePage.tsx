
import React from 'react';
import { UserRole } from '../../../entities/user';

interface HomePageProps {
  onSelectRole: (role: UserRole) => void;
}

const RoleCard: React.FC<{
  role: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: () => void;
}> = ({ role, title, description, icon, onSelect }) => {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/80 rounded-3xl p-8 flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform duration-300 z-10">
      <div className="text-emerald-400 mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-neutral-400 mb-6 flex-grow">{description}</p>
      <button
        onClick={onSelect}
        className="w-full px-5 py-3 bg-emerald-600 text-white font-semibold rounded-3xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-emerald-500 transition-colors"
      >
        Enter Portal
      </button>
    </div>
  );
};

const HomePage: React.FC<HomePageProps> = ({ onSelectRole }) => {
  return (
    <div className="h-full overflow-y-auto flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-transparent relative z-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
          Welcome to Smart Scheduler
        </h1>
        <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto">
          Your unified platform for seamless school scheduling. Select your role to get started.
        </p>
      </div>
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <RoleCard
          role={UserRole.Student}
          title="Student Portal"
          description="Access your weekly timetable, see today's classes, and receive important notifications."
          icon={<StudentIcon />}
          onSelect={() => onSelectRole(UserRole.Student)}
        />
        <RoleCard
          role={UserRole.Teacher}
          title="Teacher Portal"
          description="Manage your schedule, view assigned classes, and communicate with the administration."
          icon={<TeacherIcon />}
          onSelect={() => onSelectRole(UserRole.Teacher)}
        />
        <RoleCard
          role={UserRole.Admin}
          title="Admin Console"
          description="Generate school-wide timetables, manage resources, and view insightful reports."
          icon={<AdminIcon />}
          onSelect={() => onSelectRole(UserRole.Admin)}
        />
      </div>
    </div>
  );
};


const StudentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222 4 2.222V20" />
    </svg>
);
const TeacherIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


export default HomePage;
