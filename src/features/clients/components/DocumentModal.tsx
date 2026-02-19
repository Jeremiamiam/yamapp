'use client';

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDocDate } from '@/lib/date-utils';
import { getDocumentTypeStyle } from '@/lib/styles';
import { DocumentType } from '@/types';
import type { Call, ClientDocument, Deliverable } from '@/types';
import { parseStructuredDocument } from '@/types/document-templates';
import type { BriefTemplate, ReportPlaudTemplate } from '@/types/document-templates';
import { toast } from '@/lib/toast';
import { PlaudLogo } from '@/components/ui';
import { ReportView } from './ReportView';

// Icons
const X = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Briefcase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const StickyNote = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/>
    <path d="M15 3v6h6"/>
  </svg>
);

const Edit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const Trash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

function BriefTemplatedView({ data }: { data: BriefTemplate }) {
  return (
    <div className="space-y-5 text-[var(--text-secondary)]">
      {data.clientContext && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Contexte client</h3>
          <p className="text-sm leading-relaxed">{data.clientContext}</p>
        </section>
      )}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Objectifs</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">{data.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
      </section>
      {data.targetAudience && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Cible</h3>
          <p className="text-sm">{data.targetAudience}</p>
        </section>
      )}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Produits</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">{data.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
      </section>
      {data.constraints && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Contraintes</h3>
          <p className="text-sm">{data.constraints}</p>
        </section>
      )}
      {(data.deadline || data.tone || data.references || data.notes) && (
        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
          {data.deadline && <span>Echeance : {data.deadline}</span>}
          {data.tone && <span>Ton : {data.tone}</span>}
          {data.references && <span>References : {data.references}</span>}
          {data.notes && <span>{data.notes}</span>}
        </div>
      )}
    </div>
  );
}

/** Découpe le contenu texte du brief (template MARQUE / CIBLE / …) en sections pour affichage lisible. */
function parseBriefSections(content: string): { title: string; body: string }[] {
  const lines = content.split('\n');
  const sections: { title: string; body: string }[] = [];
  let current: { title: string; body: string } | null = null;
  const isSectionHeader = (line: string) => /^[A-ZÀ-Ÿ][A-ZÀ-Ÿ0-9\s]+$/.test(line.trim()) && line.trim().length > 1;
  for (const line of lines) {
    if (isSectionHeader(line)) {
      if (current) sections.push(current);
      current = { title: line.trim(), body: '' };
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);
  return sections;
}

function BriefContentView({ content }: { content: string }) {
  const sections = parseBriefSections(content);
  if (sections.length === 0) {
    return (
      <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap text-[15px]">
        {content}
      </p>
    );
  }
  return (
    <div className="space-y-8 max-w-[65ch]">
      {sections.map((sec, i) => (
        <section key={i}>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2.5">
            {sec.title}
          </h3>
          <p className="text-[15px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
            {sec.body.trim()}
          </p>
        </section>
      ))}
    </div>
  );
}

function getDocTypeStyle(type: DocumentType) {
  const base = getDocumentTypeStyle(type);
  const icon =
    type === 'brief' ? <Briefcase /> :
    type === 'report' ? <PlaudLogo className="w-4 h-4" /> :
    type === 'creative-strategy' ? (
      <span className="text-base font-bold" style={{ color: 'var(--accent-lime)' }}>⬡</span>
    ) : <StickyNote />;
  return { ...base, icon };
}

/** Parse le rapport final du Creative Board (## Synthèse, ### Tension stratégique, etc.) */
function parseStrategySections(text: string): { title: string; body: string }[] {
  const cleaned = text.replace(/^##\s+.*\n?/m, '').trim();
  const parts = cleaned.split(/\n###\s+/);
  const sections: { title: string; body: string }[] = [];
  for (const part of parts) {
    if (!part.trim()) continue;
    const firstLine = part.indexOf('\n');
    const title = firstLine === -1 ? part.trim() : part.slice(0, firstLine).trim();
    const body = firstLine === -1 ? '' : part.slice(firstLine + 1).trim();
    if (title) sections.push({ title, body });
  }
  return sections;
}

const STRATEGY_CARD_STYLES: Record<string, { color: string; icon: string; bg: string }> = {
  'Tension stratégique':  { color: 'var(--accent-cyan)',   icon: '◈', bg: 'var(--accent-cyan-dim)'   },
  'Angle retenu':         { color: 'var(--accent-amber)',  icon: '⬡', bg: 'var(--accent-amber-dim)'  },
  'Plateforme de Marque': { color: 'var(--accent-violet)', icon: '🏛️', bg: 'var(--accent-violet-dim)' },
  'Territoire & Copy':    { color: 'var(--accent-lime)',   icon: '✦', bg: 'var(--accent-lime-dim)'   },
  'Points de vigilance':  { color: 'var(--accent-coral)', icon: '◉', bg: 'var(--accent-coral-dim)'  },
};

// ─── Brand Platform Types & Component ───

interface BrandPlatformData {
  the_battlefield: { status_quo: string; the_enemy: string; the_gap: string };
  the_hero_and_villain: { the_cult_member: string; the_anti_persona: string };
  core_identity: { origin_story: string; radical_promise: string; archetype_mix: { dominant: string; twist: string } };
  expression_matrix: {
    is_vs_is_not: { is: string; is_not: string }[];
    vocabulary_trigger_words: string[];
    banned_words: string[];
  };
  the_manifesto: { part_1_frustration: string; part_2_belief: string; part_3_solution: string };
}

function BrandPlatformView({ data }: { data: BrandPlatformData }) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Introduction : Le Champ de Bataille */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-tertiary)]/50 p-5 rounded-xl border border-[var(--border-subtle)]">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Status Quo</h4>
          <p className="text-sm">{data.the_battlefield.status_quo}</p>
        </div>
        <div className="bg-red-500/5 p-5 rounded-xl border border-red-500/20">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">L'Ennemi</h4>
          <p className="text-sm text-red-200/90">{data.the_battlefield.the_enemy}</p>
        </div>
        <div className="bg-[var(--accent-lime)]/5 p-5 rounded-xl border border-[var(--accent-lime)]/20">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-lime)] mb-2">Le Gap</h4>
          <p className="text-sm text-[var(--accent-lime)]/90">{data.the_battlefield.the_gap}</p>
        </div>
      </section>

      {/* Identité & Héros */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-[var(--text-secondary)]">Identité Profonde</h3>
          <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-subtle)] space-y-4">
            <div>
              <span className="text-xs text-[var(--text-muted)]">Histoire d'origine</span>
              <p className="text-sm mt-1">{data.core_identity.origin_story}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Promesse Radicale</span>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-1">"{data.core_identity.radical_promise}"</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Archétypes</span>
              <div className="flex gap-2 mt-1">
                <span className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs font-medium">{data.core_identity.archetype_mix.dominant}</span>
                <span className="text-xs text-[var(--text-muted)] self-center">+</span>
                <span className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs font-medium">{data.core_identity.archetype_mix.twist}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-[var(--text-secondary)]">Casting</h3>
          <div className="grid gap-4 h-full">
            <div className="bg-[var(--accent-cyan)]/5 p-5 rounded-xl border border-[var(--accent-cyan)]/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🤩</span>
                <h4 className="text-xs font-bold text-[var(--accent-cyan)]">Le Client Idéal</h4>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{data.the_hero_and_villain.the_cult_member}</p>
            </div>
            <div className="bg-[var(--bg-tertiary)] p-5 rounded-xl border border-[var(--border-subtle)] opacity-70">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🚫</span>
                <h4 className="text-xs font-bold text-[var(--text-muted)]">L'Anti-Persona</h4>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{data.the_hero_and_villain.the_anti_persona}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Matrice d'Expression */}
      <section>
        <h3 className="text-sm font-bold uppercase text-[var(--text-secondary)] mb-4">Matrice d'Expression</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {data.expression_matrix.is_vs_is_not.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/30 border border-[var(--border-subtle)]">
                <span className="font-medium text-[var(--accent-lime)]">{item.is}</span>
                <span className="text-xs text-[var(--text-muted)]">mais pas</span>
                <span className="font-medium text-[var(--text-muted)] line-through decoration-red-500/50">{item.is_not}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[var(--text-muted)] block mb-2">Mots Clés</span>
              <div className="flex flex-wrap gap-2">
                {data.expression_matrix.vocabulary_trigger_words.map((w, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] text-xs border border-[var(--accent-cyan)]/20">{w}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] block mb-2">Mots Interdits</span>
              <div className="flex flex-wrap gap-2">
                {data.expression_matrix.banned_words.map((w, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs border border-red-500/20">{w}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manifeste */}
      <section className="bg-[var(--bg-card)] p-8 rounded-xl border border-[var(--border-subtle)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">📜</div>
        <div className="space-y-6 relative z-10 font-serif text-[var(--text-primary)]">
          <p className="text-lg leading-relaxed border-l-2 border-red-500/50 pl-4">{data.the_manifesto.part_1_frustration}</p>
          <p className="text-lg leading-relaxed border-l-2 border-[var(--accent-cyan)]/50 pl-4">{data.the_manifesto.part_2_belief}</p>
          <p className="text-xl font-bold leading-relaxed border-l-4 border-[var(--accent-lime)] pl-4 text-[var(--accent-lime)]">{data.the_manifesto.part_3_solution}</p>
        </div>
      </section>
    </div>
  );
}

function CreativeStrategyView({ content }: { content: string }) {
  const sections = parseStrategySections(content);
  const defaultStyle = { color: 'var(--accent-lime)', icon: '◆', bg: 'var(--accent-lime-dim)' };
  const displaySections = sections.length > 0
    ? sections
    : [{ title: 'Synthèse', body: content.replace(/^##\s+.*\n?/m, '').trim() || content }];

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const activeSection = displaySections[activeTabIndex] || displaySections[0];
  const activeStyle = STRATEGY_CARD_STYLES[activeSection.title] ?? defaultStyle;

  // Détection auto du JSON pour la Plateforme de Marque
  const isPlatformSection = activeSection.title === 'Plateforme de Marque';
  let platformData: BrandPlatformData | null = null;
  if (isPlatformSection) {
    try {
      // Extraction plus robuste : chercher le premier { et le dernier }
      const firstBrace = activeSection.body.indexOf('{');
      const lastBrace = activeSection.body.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonCandidate = activeSection.body.substring(firstBrace, lastBrace + 1);
        platformData = JSON.parse(jsonCandidate);
      } else {
        // Fallback simple
        const cleanJson = activeSection.body.replace(/```json\n?|\n?```/g, '').trim();
        platformData = JSON.parse(cleanJson);
      }
    } catch {
      // Pas du JSON valide, on affiche le texte brut
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 rounded-full bg-[var(--accent-lime)]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Synthèse du Board</span>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto">
        {displaySections.map((section, i) => {
          const s = STRATEGY_CARD_STYLES[section.title] ?? defaultStyle;
          const isActive = i === activeTabIndex;
          return (
            <button
              key={i}
              onClick={() => setActiveTabIndex(i)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-bold transition-all border-b-2
                ${isActive 
                  ? 'bg-[var(--bg-tertiary)]/50' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border-transparent'}
              `}
              style={isActive ? { 
                color: s.color, 
                borderColor: s.color 
              } : {}}
            >
              <span className={isActive ? '' : 'opacity-70'}>{s.icon}</span>
              {section.title}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div 
        className="rounded-xl p-8 border transition-all animate-fade-in-up"
        style={{ 
          background: activeStyle.bg, 
          borderColor: `${activeStyle.color}20`,
          minHeight: '400px'
        }}
      >
        <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: `1px solid ${activeStyle.color}25` }}>
           <span
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-sm"
            style={{ background: `${activeStyle.color}18`, color: activeStyle.color }}
          >
            {activeStyle.icon}
          </span>
          <h3 className="text-xl font-bold tracking-tight" style={{ color: activeStyle.color }}>
            {activeSection.title}
          </h3>
        </div>
        
        <div className="prose prose-invert max-w-none">
          {platformData ? (
            <BrandPlatformView data={platformData} />
          ) : (
            <p className="text-[16px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-normal">
              {activeSection.body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentModalContent({
  document: selectedDocument,
  structured,
  onClose,
  clientId,
  onAddDeliverable,
  onSuggestContact,
  onAddCall,
  onEditDocument,
  onDeleteDocument,
}: {
  document: ClientDocument;
  structured: BriefTemplate | ReportPlaudTemplate | null;
  onClose: () => void;
  clientId?: string;
  onAddDeliverable?: (d: Omit<Deliverable, 'id' | 'createdAt'>) => void;
  onSuggestContact?: (name: string) => void;
  onAddCall?: (call: Omit<Call, 'id' | 'createdAt'>) => void;
  onEditDocument?: () => void;
  onDeleteDocument?: () => void;
}) {
  const updateDocument = useAppStore((s) => s.updateDocument);
  const addDocument = useAppStore((s) => s.addDocument);
  const openDocument = useAppStore((s) => s.openDocument);
  const navigateToCreativeBoard = useAppStore((s) => s.navigateToCreativeBoard);
  const docStyle = getDocTypeStyle(selectedDocument.type);
  const showTemplated = structured !== null;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [showTranscriptInput, setShowTranscriptInput] = useState(false);
  const [fallbackTranscript, setFallbackTranscript] = useState('');

  const reportData = structured && selectedDocument.type === 'report' ? (structured as ReportPlaudTemplate) : null;
  const onEventAdded = useCallback(
    (eventKey: string) => {
      if (!reportData || !clientId) return;
      const next = { ...reportData, addedEventKeys: [...(reportData.addedEventKeys || []), eventKey] };
      updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(next) });
    },
    [reportData, clientId, selectedDocument.id, updateDocument]
  );
  const onBackfillAddedEventKeys = useCallback(
    (keys: string[]) => {
      if (!reportData || !clientId || keys.length === 0) return;
      const next = { ...reportData, addedEventKeys: [...(reportData.addedEventKeys || []), ...keys] };
      updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(next) });
    },
    [reportData, clientId, selectedDocument.id, updateDocument]
  );

  const runBriefGeneration = useCallback(async (transcript: string) => {
    setGeneratingBrief(true);
    try {
      const res = await fetch('/api/brief-from-plaud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawTranscript: transcript }),
      });
      const data = await res.json() as { brief?: string; error?: string };
      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Erreur lors de la génération du brief.');
        return;
      }
      const briefContent = data.brief ?? '';
      let createdDoc: import('@/types').ClientDocument | null = null;
      if (clientId) {
        createdDoc = await addDocument(clientId, {
          type: 'brief',
          title: `Brief - ${reportData?.title ?? 'Plaud'}`,
          content: briefContent,
        });
      }
      onClose();
      if (createdDoc) {
        toast.success('Brief généré', {
          action: { label: 'Voir le brief', onClick: () => openDocument(createdDoc!) },
        });
      }
    } catch {
      toast.error('Impossible de générer le brief.');
    } finally {
      setGeneratingBrief(false);
    }
  }, [onClose, clientId, reportData?.title, addDocument, openDocument]);

  const handleGenerateBrief = useCallback(() => {
    const transcript = reportData?.rawTranscript;
    if (transcript) {
      runBriefGeneration(transcript);
    } else {
      setShowTranscriptInput((v) => !v);
    }
  }, [reportData, runBriefGeneration]);

  const handleFallbackSubmit = useCallback(() => {
    if (!fallbackTranscript.trim()) return;
    // Persiste rawTranscript dans le document pour les prochaines fois
    if (reportData && clientId) {
      const next = { ...reportData, rawTranscript: fallbackTranscript.trim() };
      updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(next) });
    }
    runBriefGeneration(fallbackTranscript.trim());
  }, [fallbackTranscript, reportData, clientId, selectedDocument.id, updateDocument, runBriefGeneration]);

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleDeleteCancel = () => setShowDeleteConfirm(false);
  const handleDeleteConfirm = () => {
    onDeleteDocument?.();
    setShowDeleteConfirm(false);
    toast.success('Document supprime');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className={`relative w-full max-h-[85vh] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col ${selectedDocument.type === 'report' || selectedDocument.type === 'creative-strategy' ? 'max-w-4xl' : 'max-w-2xl'}`}
        onClick={e => e.stopPropagation()}
        style={{ animationDuration: '0.2s' }}
      >
        <div className="flex-shrink-0 px-6 py-5 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <span className={`p-2.5 rounded-xl ${docStyle.bg} ${docStyle.text} flex-shrink-0`}>
              {docStyle.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${docStyle.text}`}>
                  {docStyle.label}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">-</span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {formatDocDate(selectedDocument.createdAt)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">
                {selectedDocument.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onEditDocument && (
              <button
                type="button"
                onClick={onEditDocument}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Modifier"
              >
                <Edit />
              </button>
            )}
            {onDeleteDocument && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                title="Supprimer"
              >
                <Trash />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {showTemplated && selectedDocument.type === 'brief' && (
            <BriefTemplatedView data={structured as BriefTemplate} />
          )}
          {showTemplated && selectedDocument.type === 'report' && (
            <ReportView
              data={structured as ReportPlaudTemplate}
              clientId={clientId}
              onAddDeliverable={onAddDeliverable}
              onSuggestContact={onSuggestContact}
              onAddCall={onAddCall}
              onEventAdded={onEventAdded}
              onBackfillAddedEventKeys={onBackfillAddedEventKeys}
            />
          )}
          {!showTemplated && (
            selectedDocument.type === 'brief' ? (
              <BriefContentView content={selectedDocument.content} />
            ) : selectedDocument.type === 'creative-strategy' ? (
              <CreativeStrategyView content={selectedDocument.content} />
            ) : (
              <div className="prose prose-invert max-w-none">
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap text-[15px]">
                  {selectedDocument.content}
                </p>
              </div>
            )
          )}
        </div>
        <div className="flex-shrink-0 border-t border-[var(--border-subtle)]">
          {showTranscriptInput && (
            <div className="px-6 pt-4 pb-3 border-b border-[var(--border-subtle)] space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-violet)]">
                Colle le transcript PLAUD pour générer le brief
              </label>
              <textarea
                value={fallbackTranscript}
                onChange={(e) => setFallbackTranscript(e.target.value)}
                placeholder="Colle ici le texte exporté depuis l'app PLAUD…"
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-violet)]/40 transition-colors"
                autoFocus
              />
              <button
                onClick={handleFallbackSubmit}
                disabled={!fallbackTranscript.trim() || generatingBrief}
                className="w-full py-2 rounded-lg bg-[var(--accent-violet)] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {generatingBrief ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Génération…
                  </>
                ) : (
                  'Générer le brief →'
                )}
              </button>
            </div>
          )}
          <div className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-[var(--text-muted)]">
              Dernière modification : {formatDocDate(selectedDocument.updatedAt)}
            </span>
            <div className="flex items-center gap-2">
              {selectedDocument.type === 'brief' && (
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('creative-board-brief-prefill', selectedDocument.content);
                    if (clientId) sessionStorage.setItem('creative-board-client-id', clientId);
                    navigateToCreativeBoard();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-lime)]/15 border border-[var(--accent-lime)]/30 text-sm font-semibold text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/25 transition-colors flex items-center gap-2"
                >
                  <span>⬡</span>
                  Envoyer au board
                </button>
              )}
              {reportData && (
                <button
                  onClick={handleGenerateBrief}
                  disabled={generatingBrief}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-violet)]/15 border border-[var(--accent-violet)]/30 text-sm font-semibold text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {generatingBrief ? (
                    <>
                      <span className="w-3 h-3 border-2 border-[var(--accent-violet)]/30 border-t-[var(--accent-violet)] rounded-full animate-spin" />
                      Génération…
                    </>
                  ) : (
                    '⬡ Brief Créatif →'
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/50"
          onClick={handleDeleteCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <p id="confirm-delete-title" className="text-[var(--text-primary)] font-medium mb-4">
              Supprimer ce document ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DocumentModal() {
  const openModal = useAppStore((s) => s.openModal);
  const { selectedDocument, closeDocument, selectedClientId, addDeliverable, addCall, deleteDocument } = useAppStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDocument();
    },
    [closeDocument]
  );

  useEffect(() => {
    if (selectedDocument) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedDocument, handleKeyDown]);

  const structured = useMemo(() => {
    if (!selectedDocument || (selectedDocument.type !== 'brief' && selectedDocument.type !== 'report')) return null;
    return parseStructuredDocument(selectedDocument.content, selectedDocument.type);
  }, [selectedDocument?.content, selectedDocument?.type]);

  const onEditDocument = useCallback(() => {
    if (!selectedDocument || !selectedClientId) return;
    closeDocument();
    openModal({
      type: 'document',
      mode: 'edit',
      clientId: selectedClientId,
      document: selectedDocument,
    });
  }, [selectedDocument, selectedClientId, closeDocument, openModal]);

  const onDeleteDocument = useCallback(() => {
    if (!selectedDocument || !selectedClientId) return;
    deleteDocument(selectedClientId, selectedDocument.id);
    closeDocument();
  }, [selectedDocument, selectedClientId, deleteDocument, closeDocument]);

  const handleSuggestContact = useCallback(
    (name: string) => {
      if (!selectedClientId) return;
      closeDocument();
      openModal({
        type: 'contact',
        mode: 'create',
        clientId: selectedClientId,
        presetContact: { name, role: 'Intervenant' },
      });
    },
    [selectedClientId, closeDocument, openModal]
  );
  const handleAddContact = handleSuggestContact;

  const handleAddCall = useCallback(
    (call: Omit<Call, 'id' | 'createdAt'>) => {
      addCall(call);
    },
    [addCall]
  );

  return selectedDocument ? (
    <DocumentModalContent
      document={selectedDocument}
      structured={structured}
      onClose={closeDocument}
      clientId={selectedClientId ?? undefined}
      onAddDeliverable={addDeliverable}
      onSuggestContact={handleAddContact}
      onAddCall={handleAddCall}
      onEditDocument={onEditDocument}
      onDeleteDocument={onDeleteDocument}
    />
  ) : null;
}
