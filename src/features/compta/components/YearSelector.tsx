'use client';

import { useAppStore } from '@/lib/store';

const ChevronLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export function YearSelector() {
  const { comptaYear, setComptaYear } = useAppStore();
  const currentYear = new Date().getFullYear();
  const minYear = 2020;
  const maxYear = currentYear + 2;

  const handlePrevious = () => {
    if (comptaYear > minYear) {
      setComptaYear(comptaYear - 1);
    }
  };

  const handleNext = () => {
    if (comptaYear < maxYear) {
      setComptaYear(comptaYear + 1);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-[var(--bg-secondary)] rounded-lg p-2">
      <button
        onClick={handlePrevious}
        disabled={comptaYear <= minYear}
        aria-label="Année précédente"
        className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft />
      </button>
      <div className="text-xl font-bold text-[var(--text-primary)] min-w-[4rem] text-center">
        {comptaYear}
      </div>
      <button
        onClick={handleNext}
        disabled={comptaYear >= maxYear}
        aria-label="Année suivante"
        className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
