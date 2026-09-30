import React from 'react';

/**
 * Green Deck Card Component
 * Surface Level 1 (#181818) with hover elevation to Level 2 (#282828)
 */
export default function Card({
  children,
  className = '',
  style = {},
  hoverable = true,
  onClick
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  const cardStyle = {
    backgroundColor: isHovered && hoverable ? 'var(--color-surface-l2)' : 'var(--color-surface-l1)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
    cursor: onClick ? 'pointer' : 'default',
    border: '1px solid var(--color-border)',
    ...style
  };

  return (
    <div
      style={cardStyle}
      className={`green-deck-card ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
