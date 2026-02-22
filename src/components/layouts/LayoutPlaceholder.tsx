'use client';

/**
 * Placeholder visible pour les layouts inconnus.
 * Affiché quand un rôle de section produit par un agent n'a pas de layout enregistré.
 */
export function LayoutPlaceholder({
  role,
  matchedRole,
  onGenerate,
}: {
  role: string;
  matchedRole?: string;
  onGenerate?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 min-h-[200px] px-6 py-8 border-2 border-dashed"
      style={{
        borderColor: 'var(--border-medium)',
        color: 'var(--text-muted)',
      }}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <code
          className="text-sm font-mono px-2 py-1 rounded-md"
          style={{
            color: 'var(--text-primary)',
            backgroundColor: 'rgba(var(--accent-cyan-rgb, 0 229 255) / 0.08)',
          }}
        >
          {role}
        </code>
        <p
          className="text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          Layout inexistant
        </p>
      </div>

      {matchedRole && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Role similaire disponible :{' '}
          <span
            className="font-mono font-semibold"
            style={{ color: 'var(--accent-cyan)' }}
          >
            {matchedRole}
          </span>
        </p>
      )}

      {onGenerate && (
        <button
          type="button"
          onClick={onGenerate}
          className="mt-1 px-4 py-2 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
          style={{
            backgroundColor: 'var(--accent-cyan)',
            color: '#000',
          }}
        >
          Generer ce layout
        </button>
      )}
    </div>
  );
}
