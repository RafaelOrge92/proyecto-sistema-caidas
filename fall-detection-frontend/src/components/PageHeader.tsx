import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    actionButton?: {
        label: string;
        icon: LucideIcon;
        onClick: () => void;
    };
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    icon: Icon,
    actionButton
}) => {
    return (
        <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
                <h1 
                    className="text-5xl font-bold tracking-tight"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    {title}
                </h1>
                {subtitle && (
                    <p 
                        className="text-xl mt-2"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        {subtitle}
                    </p>
                )}
            </div>

            {actionButton && (
                <button
                    onClick={actionButton.onClick}
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] flex items-center gap-2"
                >
                    <actionButton.icon size={20} />
                    {actionButton.label}
                </button>
            )}
        </header>
    );
};
