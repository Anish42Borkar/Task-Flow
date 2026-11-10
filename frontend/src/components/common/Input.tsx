import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  required,
  style,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          border: `1.5px solid ${error ? '#ef4444' : '#e2e8f0'}`,
          borderRadius: '10px',
          padding: '0 14px',
          transition: 'border-color 0.15s ease',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
        }}
      >
        {leftIcon && (
          <span style={{ color: '#94a3b8', marginRight: '10px', display: 'flex', alignItems: 'center' }}>
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '11px 0',
            fontSize: '14px',
            color: '#0f172a',
            backgroundColor: 'transparent',
            ...style,
          }}
          {...props}
        />
        {rightIcon && (
          <span style={{ color: '#94a3b8', marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '2px' }}>{error}</span>}
    </div>
  );
};
