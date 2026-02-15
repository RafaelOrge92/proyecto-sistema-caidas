import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface FilterOption {
    value: string;
    label: string;
}

interface SortOption {
    value: string;
    label: string;
}

interface SearchFilterBarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    
    filterValue?: string;
    onFilterChange?: (value: string) => void;
    filterOptions?: FilterOption[];
    filterLabel?: string;
    
    sortValue?: string;
    onSortChange?: (value: string) => void;
    sortOptions?: SortOption[];
    sortLabel?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
    searchValue,
    onSearchChange,
    searchPlaceholder = "Buscar...",
    filterValue,
    onFilterChange,
    filterOptions = [],
    filterLabel = "Filtrar",
    sortValue,
    onSortChange,
    sortOptions = [],
    sortLabel = "Ordenar"
}) => {
    return (
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
            {/* Search Input */}
            <div className="relative flex-1">
                <Search 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" 
                    size={20} 
                />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-[var(--color-bg-secondary)] border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-[var(--color-primary)] transition-all outline-none text-lg"
                    style={{ color: 'var(--color-text-primary)' }}
                />
            </div>

            <div className="flex gap-4">
                {/* Filter Select */}
                {filterOptions && filterOptions.length > 0 && onFilterChange && (
                    <div className="relative min-w-[200px]">
                        <Filter 
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" 
                            size={20} 
                        />
                        <select
                            value={filterValue || ''}
                            onChange={(e) => onFilterChange(e.target.value)}
                            className="w-full bg-[var(--color-bg-secondary)] appearance-none rounded-2xl py-4 pl-12 pr-10 outline-none cursor-pointer focus:ring-2 focus:ring-[var(--color-primary)]"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {filterOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Sort Select */}
                {sortOptions && sortOptions.length > 0 && onSortChange && (
                    <div className="relative min-w-[200px]">
                        <ArrowUpDown 
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" 
                            size={20} 
                        />
                        <select
                            value={sortValue || ''}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="w-full bg-[var(--color-bg-secondary)] appearance-none rounded-2xl py-4 pl-12 pr-10 outline-none cursor-pointer focus:ring-2 focus:ring-[var(--color-primary)]"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};
