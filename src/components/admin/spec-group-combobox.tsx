'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
};

const SUGGESTIONS: { label: string; icon: JSX.Element }[] = [
  {
    label: 'Battery',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="16" height="10" rx="2" />
        <line x1="21" y1="10" x2="21" y2="14" />
        <line x1="5" y1="10" x2="5" y2="14" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="11" y1="10" x2="11" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Inverter',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M6 12c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0" />
      </svg>
    ),
  },
  {
    label: 'Solar',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </svg>
    ),
  },
  {
    label: 'Performance',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l5-5 4 4 9-9" />
        <polyline points="14 7 21 7 21 14" />
      </svg>
    ),
  },
  {
    label: 'Physical',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
];

export function SpecGroupCombobox({ value, onChange, name, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const filtered = value.trim()
    ? SUGGESTIONS.filter((s) =>
        s.label.toLowerCase().includes(value.trim().toLowerCase()),
      )
    : SUGGESTIONS;

  function select(label: string) {
    onChange(label);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlighted((h) => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter' && filtered[highlighted]) {
      select(filtered[highlighted].label);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="spec-combo">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={80}
        autoComplete="off"
      />
      <button
        type="button"
        className="spec-combo__toggle"
        onClick={() => {
          setOpen((o) => !o);
          inputRef.current?.focus();
        }}
        aria-label="Show suggestions"
        tabIndex={-1}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && filtered.length > 0 && (
        <ul className="spec-combo__menu" role="listbox">
          {filtered.map((s, i) => (
            <li key={s.label}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlighted}
                className={i === highlighted ? 'is-active' : ''}
                onMouseEnter={() => setHighlighted(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s.label)}
              >
                <span className="spec-combo__icon" aria-hidden="true">
                  {s.icon}
                </span>
                <span className="spec-combo__label">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}