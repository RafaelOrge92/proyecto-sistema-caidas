import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    containerClassName?: string;
    labelClassName?: string;
    fullWidth?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    error,
    containerClassName = 'space-y-2',
    labelClassName = 'text-xs font-bold text-[var(--color-text-secondary)] uppercase px-1',
    fullWidth = true,
    className = '',
    ...inputProps
}) => {
    const baseInputClasses = "w-full border rounded-2xl p-4 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all";
    const inputStyles = {
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        borderColor: 'var(--color-border)'
    };

    return (
        <div className={containerClassName}>
            <label className={labelClassName}>
                {label}
            </label>
            <input
                className={`${baseInputClasses} ${className}`}
                style={inputStyles}
                {...inputProps}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: Array<{ value: string; label: string }>;
    error?: string;
    containerClassName?: string;
    labelClassName?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
    label,
    options,
    error,
    containerClassName = 'space-y-2',
    labelClassName = 'text-xs font-bold text-[var(--color-text-secondary)] uppercase px-1',
    className = '',
    ...selectProps
}) => {
    const baseSelectClasses = "w-full border rounded-2xl p-4 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[var(--color-primary)] transition-all";
    const selectStyles = {
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        borderColor: 'var(--color-border)'
    };

    return (
        <div className={containerClassName}>
            <label className={labelClassName}>
                {label}
            </label>
            <select
                className={`${baseSelectClasses} ${className}`}
                style={selectStyles}
                {...selectProps}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};
