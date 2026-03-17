import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default' | 'processing';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  error: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  warning: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  info: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  default: 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400',
  processing: 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', variants[variant], className)}>
      {variant === 'processing' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
        </span>
      )}
      {children}
    </span>
  );
};

export function statusToBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    success: 'success',
    failed: 'error',
    processing: 'processing',
    pending: 'warning',
  };
  return map[status] || 'default';
}
