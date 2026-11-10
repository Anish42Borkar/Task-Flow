import React from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: '100%',
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: '#ffffff',
              border: `1px solid ${isSuccess ? '#a7f3d0' : isError ? '#fecaca' : '#e0e7ff'}`,
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
              animation: 'slideIn 0.25s ease-out',
            }}
          >
            <div style={{ marginTop: '2px' }}>
              {isSuccess ? (
                <CheckCircle2 size={18} color="#059669" />
              ) : isError ? (
                <AlertCircle size={18} color="#dc2626" />
              ) : (
                <Info size={18} color="#4f46e5" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>{toast.title}</h4>
              <p style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center' }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
