import React from 'react';

/**
 * Green Deck Badge / Chip Component
 */
export default function Badge({
  children,
  variant = 'default', // 'success' | 'warning' | 'error' | 'default' | 'neutral'
  size = 'md',
  className = '',
  style = {}
}) {
  const variantStyles = {
    success: {
      backgroundColor: 'rgba(29, 185, 84, 0.15)',
      color: 'var(--color-primary)',
      border: '1px solid rgba(29, 185, 84, 0.4)'
    },
    warning: {
      backgroundColor: 'rgba(245, 155, 35, 0.15)',
      color: 'var(--color-warning)',
      border: '1px solid rgba(245, 155, 35, 0.4)'
    },
    error: {
      backgroundColor: 'rgba(226, 33, 52, 0.15)',
      color: 'var(--color-error)',
      border: '1px solid rgba(226, 33, 52, 0.4)'
    },
    neutral: {
      backgroundColor: 'var(--color-surface-l2)',
      color: 'var(--color-neutral)',
      border: '1px solid var(--color-border)'
    },
    default: {
      backgroundColor: 'var(--color-surface-l2)',
      color: 'var(--color-text-primary)',
      border: '1px solid #727272'
    }
  };

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '11px' },
    md: { padding: '4px 12px', fontSize: '12px' },
    lg: { padding: '6px 16px', fontSize: '13px' }
  };

  return (
    <span
      className={`green-deck-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: 'var(--radius-pill)',
        fontWeight: '700',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style
      }}
    >
      {children}
    </span>
  );
}
