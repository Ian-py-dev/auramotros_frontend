'use client';

import React, { useState } from 'react';

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LiquidButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  disabled,
  ...props
}: LiquidButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
          color: '#ffffff',
          boxShadow: isHovered ? '0 8px 25px rgba(2, 132, 199, 0.45)' : '0 4px 14px rgba(2, 132, 199, 0.25)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
        };
      case 'secondary':
        return {
          background: 'var(--glass-bg)',
          color: 'var(--text-primary)',
          boxShadow: isHovered ? '0 8px 25px rgba(0, 0, 0, 0.15)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
          border: '1px solid var(--glass-border)',
        };
      case 'accent':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          boxShadow: isHovered ? '0 8px 25px rgba(16, 185, 129, 0.45)' : '0 4px 14px rgba(16, 185, 129, 0.25)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          boxShadow: isHovered ? '0 8px 25px rgba(239, 68, 68, 0.45)' : '0 4px 14px rgba(239, 68, 68, 0.25)',
          border: '1px solid rgba(248, 113, 113, 0.4)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '8px 16px', fontSize: '13px', borderRadius: '10px' };
      case 'md':
        return { padding: '12px 22px', fontSize: '14px', borderRadius: '12px' };
      case 'lg':
        return { padding: '14px 28px', fontSize: '15px', borderRadius: '14px' };
    }
  };

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      disabled={disabled}
      style={{
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: disabled ? 'none' : isActive ? 'scale(0.97)' : isHovered ? 'translateY(-2px)' : 'scale(1)',
        ...getSizeStyles(),
        ...getVariantStyles(),
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function LiquidPlusMenu({
  onActionClick,
}: {
  onActionClick?: (action: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const actions = [
    { id: 'survey', label: 'Nueva Encuesta', color: '#0284c7' },
    { id: 'smtp', label: 'Configurar Correo', color: '#10b981' },
    { id: 'send', label: 'Enviar a Clientes', color: '#8b5cf6' },
  ];

  return (
    <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 9999 }}>
      {open && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-end',
            marginBottom: '14px',
          }}
        >
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={() => {
                setOpen(false);
                onActionClick?.(act.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                padding: '10px 18px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(-4px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
            >
              <span>{act.label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        title="Acciones Rápidas"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
          fontSize: '22px',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        +
      </button>
    </div>
  );
}
