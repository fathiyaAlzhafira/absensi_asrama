import React, { useState } from 'react';

/**
 * Green Deck Input Component
 * Adaptive colors for device light & dark mode, clear contrast for typed text
 */
export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  name,
  error,
  icon: Icon,
  disabled = false,
  required = false,
  className = '',
  style = {}
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {label && (
        <label style={{
          fontSize: '12px',
          fontWeight: '700',
          color: 'var(--color-neutral)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          {label} {required && <span style={{ color: 'var(--color-primary)' }}>*</span>}
        </label>
      )}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }}>
        {Icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            color: 'var(--color-neutral)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={className}
          style={{
            width: '100%',
            height: '42px',
            backgroundColor: 'var(--color-surface-l2)',
            color: 'var(--color-text-primary)',
            border: isFocused ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            paddingLeft: Icon ? '40px' : '12px',
            paddingRight: '12px',
            fontSize: '14px',
            fontFamily: 'var(--font-family)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)'
          }}
        />
      </div>
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
