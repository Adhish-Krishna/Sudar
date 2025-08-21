import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  style = {},
}) => {
  // Example of using CSS variables in inline styles
  const baseStyle: React.CSSProperties = {
    backgroundColor: variant === 'primary' ? 'var(--primary-color)' : 'var(--surface-color)',
    color: variant === 'primary' ? 'white' : 'var(--text-color)',
    border: variant === 'secondary' ? '1px solid var(--border-color)' : 'none',
    borderRadius: 'var(--border-radius)',
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease-in-out',
    boxShadow: 'var(--shadow-sm)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  const hoverStyle: React.CSSProperties = {
    backgroundColor: variant === 'primary' ? 'var(--primary-hover)' : 'var(--background-color)',
    boxShadow: 'var(--shadow-md)',
    transform: 'translateY(-1px)',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, baseStyle);
        }
      }}
    >
      {children}
    </button>
  );
};

export default Button;
