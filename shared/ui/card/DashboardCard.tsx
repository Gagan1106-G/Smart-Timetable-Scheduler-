
import React from 'react';

interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'light';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon, children, className = '', variant = 'dark' }) => {
  const baseStyles = `p-4 sm:p-6 rounded-3xl transition-all duration-300 ${className}`;

  const variantStyles = {
    dark: {
      bg: 'bg-zinc-800/50',
      title: 'text-gray-100',
      icon: 'text-emerald-400',
      text: 'text-gray-300',
      border: 'border border-zinc-700/80',
    },
    light: {
      bg: 'bg-emerald-900/40',
      title: 'text-emerald-100',
      icon: 'text-emerald-300',
      text: 'text-emerald-200',
      border: 'border border-emerald-500/30',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`${baseStyles} ${styles.bg} ${styles.border}`}>
      <div className="flex items-center mb-4">
        {icon && <div className={`mr-3 ${styles.icon}`}>{icon}</div>}
        <h3 className={`text-lg font-semibold ${styles.title}`}>{title}</h3>
      </div>
      <div className={styles.text}>
        {children}
      </div>
    </div>
  );
};

export default React.memo(DashboardCard);