import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'active';
  size?: 'sm' | 'md' | 'lg';
  ariaLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'ghost',
  size = 'md',
  ariaLabel,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'p-1.5 rounded-lg text-xs',
    md: 'p-2 rounded-xl text-sm',
    lg: 'p-2.5 rounded-xl text-base',
  };

  const variantStyles = {
    ghost:
      'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-[#ECECED] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12]',
    default:
      'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-white/[0.08] dark:text-[#ECECED] dark:hover:bg-white/[0.14] border border-black/[0.05] dark:border-white/[0.08]',
    active:
      'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs',
  };

  return (
    <button
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.94] ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
