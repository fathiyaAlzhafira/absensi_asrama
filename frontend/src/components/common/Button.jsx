import React from 'react';

/**
 * Green Deck Button Component
 * Supports: primary, secondary, ghost, danger
 */
export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  onClick,
  type = 'button',
  disabled = false,
  icon: Icon,
  className = '',
  style = {}
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-pill)',
    fontFamily: 'var(--font-family)',
    fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: 'none',
    opacity: disabled ? 0.5 : 1,
    outline: 'none',
    textDecoration: 'none'
  };

  const sizeStyles = {
    sm: { height: '32px', padding: '0 16px', fontSize: '12px' },
    md: { height: '40px', padding: '0 24px', fontSize: '13px' },
    lg: { height: '48px', padding: '0 32px', fontSize: '14px' }
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#FFFFFF'
    },
    secondary: {
      backgroundColor: 'var(--color-surface-l2)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text-primary)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-neutral)',
      textTransform: 'none'
    },
    danger: {
      backgroundColor: 'var(--color-error)',
      color: '#FFFFFF'
    }
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={combinedStyles}
      className={`green-deck-btn ${variant} ${className}`}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.03)';
          if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
          if (variant === 'ghost') e.currentTarget.style.color = '#FFFFFF';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1)';
          if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--color-primary)';
          if (variant === 'ghost') e.currentTarget.style.color = 'var(--color-neutral)';
        }
      }}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
}
