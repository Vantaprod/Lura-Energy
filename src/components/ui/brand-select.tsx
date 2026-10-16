'use client';

import { useEffect, useRef, useState } from 'react';

export type BrandSelectOption = { value: string; label: string };

export type BrandSelectProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: BrandSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'compact';
};

export function BrandSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  required = false,
  fullWidth = true,
  ariaLabel,
  style,
  variant = 'default',
}: BrandSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const selectedLabel = selected ? selected.label : placeholder;
  const isEmpty = !selected;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const currentIdx = options.findIndex((o) => o.value === value);
      setHighlighted(currentIdx >= 0 ? currentIdx : 0);
    }
  }, [open, options, value]);

  function pick(optValue: string) {
    onChange(optValue);
    setOpen(false);
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (
      e.key === 'ArrowDown' ||
      e.key === 'ArrowUp' ||
      e.key === 'Enter' ||
      e.key === ' '
    ) {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[highlighted];
      if (opt) pick(opt.value);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setHighlighted(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setHighlighted(options.length - 1);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  const triggerPadding =
    variant === 'compact' ? '9px 34px 9px 12px' : '13px 40px 13px 15px';
  const triggerFontSize = variant === 'compact' ? 13 : 15;

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative',
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
    >
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        onKeyDown={onTriggerKeyDown}
        style={{
          width: '100%',
          padding: triggerPadding,
          textAlign: 'left',
          backgroundColor: '#F4F6F9',
          border: open ? '2px solid #F58220' : '2px solid transparent',
          borderRadius: 6,
          fontFamily: 'inherit',
          fontSize: triggerFontSize,
          color: disabled ? '#939AA5' : isEmpty ? '#6B7686' : '#0A1550',
          backgroundImage:
            "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231428A0' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 150ms ease, border-color 150ms ease',
        }}
      >
        {selectedLabel}
      </button>

      {open && (
        <ul
          role="listbox"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: 300,
            overflowY: 'auto',
            padding: 6,
            margin: 0,
            listStyle: 'none',
            background: '#FFFFFF',
            border: '1px solid #E4E7EC',
            borderRadius: 8,
            boxShadow: '0 12px 32px rgba(5,14,31,0.14)',
          }}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === highlighted;
            const bg = isHighlighted ? '#EEF3FF' : 'transparent';
            const color = isSelected ? '#F58220' : '#0A1550';
            return (
              <li
                key={opt.value || String(idx)}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlighted(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(opt.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                  background: bg,
                  color,
                  fontWeight: isSelected ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  transition: 'background 120ms ease',
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <span aria-hidden="true">&#10003;</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}