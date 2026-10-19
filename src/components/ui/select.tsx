'use client';

import React from 'react';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  minWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
};

export function Select({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  fullWidth = false,
  minWidth,
  className,
  style,
  'aria-label': ariaLabel,
}: SelectProps) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      style={{
        width: fullWidth ? '100%' : undefined,
        minWidth: minWidth,
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #DDE2EB',
        backgroundColor: disabled ? '#F4F6F9' : '#FFFFFF',
        color: '#0A1550',
        fontSize: '14px',
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}