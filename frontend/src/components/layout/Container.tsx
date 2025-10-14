import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  className = '', 
  size = 'xl' 
}) => {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl', 
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
};