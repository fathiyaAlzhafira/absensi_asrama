import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
  autoComplete,
  error,
  icon: Icon,
  disabled = false,
  required = false,
  className = '',
  style = {},
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
          type={resolvedType}
          name={name}
          autoComplete={autoComplete}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={className}
          {...rest}
          style={{
            width: '100%',
            height: '42px',
            backgroundColor: 'var(--color-surface-l2)',
            color: 'var(--color-text-primary)',
            border: isFocused ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            paddingLeft: Icon ? '40px' : '12px',
            paddingRight: isPassword ? '40px' : '12px',
            fontSize: '14px',
            fontFamily: 'var(--font-family)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)'
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
            title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-neutral)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
