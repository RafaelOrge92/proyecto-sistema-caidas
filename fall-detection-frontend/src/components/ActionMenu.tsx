import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ActionMenuItem {
    label: string;
    icon: LucideIcon;
    onClick: (e: React.MouseEvent) => void;
    variant?: 'default' | 'danger';
    className?: string;
}

interface ActionMenuProps {
    isOpen: boolean;
    items: ActionMenuItem[];
    onClose: () => void;
    menuRef?: React.RefObject<HTMLDivElement>;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
    isOpen,
    items,
    onClose,
    menuRef
}) => {
    if (!isOpen) return null;

    return (
        <div 
            ref={menuRef}
            className="absolute right-0 mt-2 w-48 bg-[var(--color-bg-secondary)] border border-white/10 rounded-lg shadow-lg z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            {items.map((item, index) => {
                const Icon = item.icon;
                const isLastItem = index === items.length - 1;
                const isDanger = item.variant === 'danger';

                return (
                    <button
                        key={index}
                        onClick={(e) => {
                            item.onClick(e);
                            onClose();
                        }}
                        className={`
                            flex items-center gap-3 px-4 py-2 w-full text-left transition-all
                            ${isDanger ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'text-[var(--color-text-primary)] hover:bg-white/5'}
                            ${!isLastItem ? 'border-b border-white/5' : ''}
                        `}
                        style={isDanger ? { color: '#EF4444' } : {}}
                    >
                        <Icon size={18} />
                        <span className="text-sm font-medium">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
