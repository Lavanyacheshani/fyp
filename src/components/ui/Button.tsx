import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'solid' | 'outline';
    className?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ 
    children, 
    variant = 'solid', 
    className = '',
    icon,
    onClick
}) => {
    const baseStyles = 'inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200';
    const variantStyles = {
        solid: 'bg-blue-600 text-white hover:bg-blue-700',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            onClick={onClick}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
