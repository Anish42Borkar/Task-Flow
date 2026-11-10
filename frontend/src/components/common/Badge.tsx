import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pending' | 'progress' | 'completed' | 'active' | 'inactive' | 'role' | 'default';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  dot = false,
}) => {
  const getStyles = (): { bg: string; text: string; dotColor?: string } => {
    switch (variant) {
      case 'pending':
        return { bg: '#f1f5f9', text: '#475569', dotColor: '#94a3b8' };
      case 'progress':
        return { bg: '#eff6ff', text: '#2563eb', dotColor: '#3b82f6' };
      case 'completed':
        return { bg: '#ecfdf5', text: '#059669', dotColor: '#10b981' };
      case 'active':
        return { bg: '#ecfdf5', text: '#059669', dotColor: '#10b981' };
      case 'inactive':
        return { bg: '#fef2f2', text: '#dc2626', dotColor: '#ef4444' };
      case 'role':
        return { bg: '#eef2ff', text: '#4f46e5' };
      default:
        return { bg: '#f8fafc', text: '#64748b' };
    }
  };

  const { bg, text, dotColor } = getStyles();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: bg,
        color: text,
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12.5px',
        fontWeight: 600,
        lineHeight: 1.4,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: dotColor || text,
          }}
        />
      )}
      {children}
    </span>
  );
};
