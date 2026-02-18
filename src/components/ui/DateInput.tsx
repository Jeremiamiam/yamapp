'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface DateInputProps {
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0');
}

function parseDate(iso: string): { day: string; month: string; year: string } {
  if (!iso) {
    const now = new Date();
    return { day: pad(now.getDate()), month: pad(now.getMonth() + 1), year: String(now.getFullYear()) };
  }
  const [y, m, d] = iso.split('-');
  return { day: d || '', month: m || '', year: y || '' };
}

function toIso(day: string, month: string, year: string): string {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 2000) return '';
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

export function DateInput({ value, onChange, className = '' }: DateInputProps) {
  const parsed = parseDate(value);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    const p = parseDate(value);
    setDay(p.day);
    setMonth(p.month);
    setYear(p.year);
  }, [value]);

  const emit = useCallback((d: string, m: string, y: string) => {
    const iso = toIso(d, m, y);
    if (iso) onChange(iso);
  }, [onChange]);

  const handleDayChange = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setDay(clean);
    if (clean.length === 2) monthRef.current?.focus();
    emit(clean, month, year);
  };

  const handleMonthChange = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setMonth(clean);
    if (clean.length === 2) yearRef.current?.focus();
    emit(day, clean, year);
  };

  const handleYearChange = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    setYear(clean);
    emit(day, month, clean);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'day' | 'month' | 'year') => {
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      if (input.value === '') {
        e.preventDefault();
        if (field === 'month') dayRef.current?.focus();
        if (field === 'year') monthRef.current?.focus();
      }
    }
    if (e.key === '/' || e.key === '-' || e.key === '.') {
      e.preventDefault();
      if (field === 'day') monthRef.current?.focus();
      if (field === 'month') yearRef.current?.focus();
    }
  };

  const cellClass = 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] text-center focus:outline-none focus:border-[var(--accent-cyan)] rounded-lg py-1.5';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        value={day}
        onChange={(e) => handleDayChange(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, 'day')}
        placeholder="JJ"
        className={`w-[32px] px-1 ${cellClass}`}
      />
      <span className="text-[10px] text-[var(--text-muted)]">/</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        value={month}
        onChange={(e) => handleMonthChange(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, 'month')}
        placeholder="MM"
        className={`w-[32px] px-1 ${cellClass}`}
      />
      <span className="text-[10px] text-[var(--text-muted)]">/</span>
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        value={year}
        onChange={(e) => handleYearChange(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, 'year')}
        placeholder="AAAA"
        className={`w-[48px] px-1 ${cellClass}`}
      />
    </div>
  );
}
