import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: 600,
      borderRadius: '10px',
      transition: 'all 0.15s ease-in-out',
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.65 : 1,
      fontFamily: 'inherit',
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: '6px 14px', fontSize: '13px' },
      md: { padding: '10px 20px', fontSize: '14px' },
      lg: { padding: '12px 24px', fontSize: '15px' },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: '#4f46e5',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 1px 2px rgba(79, 70, 229, 0.2)',
      },
      secondary: {
        backgroundColor: '#f1f5f9',
        color: '#334155',
        border: 'none',
      },
      outline: {
        backgroundColor: '#ffffff',
        color: '#475569',
        border: '1px solid #e2e8f0',
      },
      danger: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        border: 'none',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#64748b',
        border: 'none',
      },
    };

    return { ...base, ...sizeStyles[size], ...variantStyles[variant] };
  };

  return (
    <button
      style={getStyles()}
      disabled={disabled || isLoading}
      className={className}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
