import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage?: number;
    totalItems?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems
}) => {
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className="flex items-center justify-center gap-4 py-8">
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="p-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2"
                style={{
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                    backgroundColor: 'var(--color-primary)',
                    opacity: currentPage === 1 ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                    if (currentPage > 1) {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                }}
                title="Página anterior"
            >
                <ChevronLeft size={24} className="text-white" />
            </button>

            <span className="text-[var(--color-text-secondary)] font-semibold whitespace-nowrap">
                Página {currentPage} de {totalPages}
            </span>

            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2"
                style={{
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                    backgroundColor: 'var(--color-primary)',
                    opacity: currentPage === totalPages ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                    if (currentPage < totalPages) {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                }}
                title="Página siguiente"
            >
                <ChevronRight size={24} className="text-white" />
            </button>
        </div>
    );
};
