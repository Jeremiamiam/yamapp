'use client';

import { useState } from 'react';
import { runAllTests } from '@/lib/production-rules';

/**
 * Composant de test des règles métier Production.
 * Exécute automatiquement tous les cas de test définis dans production-rules.ts
 * et affiche les résultats visuellement.
 */
export function ProductionRulesTest() {
  const [results, setResults] = useState<ReturnType<typeof runAllTests> | null>(null);

  const handleRun = () => {
    setResults(runAllTests());
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        Tests des règles Production ↔ Facturation
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Vérifie que toutes les transitions de statut respectent les règles métier.
      </p>

      <button
        onClick={handleRun}
        className="px-4 py-2 rounded-lg bg-[var(--accent-cyan)] text-[var(--bg-primary)] text-sm font-semibold hover:scale-105 active:scale-95 transition-transform mb-6"
      >
        Lancer les tests
      </button>

      {results && (
        <div>
          {/* Summary */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-4 ${
            results.failed === 0 
              ? 'bg-[var(--accent-lime)]/10 border border-[var(--accent-lime)]/30' 
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <span className="text-2xl">{results.failed === 0 ? '✅' : '❌'}</span>
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {results.passed}/{results.passed + results.failed} tests passés
              </span>
              {results.failed > 0 && (
                <span className="text-sm text-red-400 ml-2">
                  ({results.failed} échec{results.failed > 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>

          {/* Individual results */}
          <div className="space-y-1">
            {results.results.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 px-3 py-2 rounded text-xs ${
                  r.pass 
                    ? 'bg-[var(--bg-secondary)]/30' 
                    : 'bg-red-500/10 border border-red-500/20'
                }`}
              >
                <span className="flex-shrink-0 mt-0.5">{r.pass ? '✓' : '✗'}</span>
                <div className="min-w-0">
                  <span className={`font-medium ${r.pass ? 'text-[var(--text-muted)]' : 'text-red-400'}`}>
                    {r.name}
                  </span>
                  {r.detail && (
                    <p className="text-red-400/80 mt-0.5">{r.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
