import { JSX } from 'preact';

interface ButtonProps {
  children: JSX.Element | string;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'delete' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  title,
  type = 'button'
}: ButtonProps) {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    delete: 'btn-delete',
    secondary: 'btn-secondary'
  };
  const sizeClasses = {
    small: 'btn-small',
    medium: 'btn-medium',
    large: 'btn-large'
  };

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled ? 'btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

