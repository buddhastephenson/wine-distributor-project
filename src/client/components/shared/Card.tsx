import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    footer?: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({
    children,
    title,
    description,
    footer,
    className = '',
}) => {
    return (
        <div className={`bg-white shadow rounded-lg overflow-hidden border border-gray-200 ${className}`}>
            {(title || description) && (
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    {title && <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>}
                    {description && <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>}
                </div>
            )}
            <div className="px-4 py-5 sm:p-6">{children}</div>
            {footer && <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">{footer}</div>}
        </div>
    );
};
