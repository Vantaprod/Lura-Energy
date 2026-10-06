'use client';

import { useEffect, useRef, useState } from 'react';

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  options: SelectOption[];
  onChange: (next: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  minWidth?: number;
  fullWidth?: boolean;
  'aria-label'?: string;
};

export function Select({
  value,
  options,
  onChange,
  placeholder,
  id,
  disabled = false,
  required = false,
  name,
  minWidth = 180,
  fullWidth = false,
  'aria-label': ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);
  const label = current?.label ?? placeholder ?? '';

  // Hidden input keeps native form submission working if the Select is inside a <form>
  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {name && <input type="hidden" name={name} value={value} />}

      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-required={required}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          width: fullWidth ? '100%' : 'auto',
          minWidth: fullWidth ? 0 : minWidth,
          padding: '9px 14px',
          minHeight: '42px',
          background: disabled ? '#F4F6F9' : '#FFFFFF',
          border: '1px solid ' + (open ? '#1428A0' : '#C9D0D9'),
          borderRadius: '4px',
          fontFamily: 'inherit',
          fontSize: '15px',
          fontWeight: 500,
          color: disabled ? '#939AA5' : value ? '#0B0F17' : '#939AA5',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 150ms ease',
          lineHeight: 1.2,
          textAlign: 'left',
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: 'transform 200ms ease',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: fullWidth ? 0 : 'auto',
            minWidth: fullWidth ? 0 : Math.max(minWidth, 200),
            maxHeight: '280px',
            overflowY: 'auto',
            background: '#FFFFFF',
            border: '1px solid #E4E7EC',
            borderRadius: '8px',
            boxShadow: '0 12px 32px rgba(5, 14, 31, 0.14)',
            padding: '6px',
            zIndex: 300,
          }}
        >
          {placeholder !== undefined && (
            <button
              type="button"
              role="option"
              aria-selected={value === ''}
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '9px 12px',
                background: value === '' ? '#E8EEF9' : 'transparent',
                color: value === '' ? '#1428A0' : '#6B7686',
                border: 0,
                borderRadius: '5px',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontStyle: 'italic',
                cursor: 'pointer',
                lineHeight: 1.25,
              }}
            >
              {placeholder}
            </button>
          )}
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  background: active ? '#E8EEF9' : 'transparent',
                  color: active ? '#1428A0' : '#0A1550',
                  border: 0,
                  borderRadius: '5px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                  lineHeight: 1.25,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = '#F4F6F9';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}