'use client';

import { useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { ReportPlaudTemplate } from '@/types/document-templates';
import { getDocumentTypeStyle } from '@/lib/styles';
import { toast } from '@/lib/toast';
import { Modal, Button, PlaudLogo } from '@/components/ui';

const Upload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const Calendar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const Phone = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const Package = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.29 7 12 12 20.71 7"/>
    <line x1="12" y1="22" x2="12" y2="12"/>
  </svg>
);

const Sparkle = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
  </svg>
);

const FileCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="m9 15 2 2 4-4"/>
  </svg>
);

function formatDateFr(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function sameDay(a: Date | string | null | undefined, b: string): boolean {
  if (a == null) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export function ReportUploadModal() {
  const { activeModal, closeModal, addDocument, addDeliverable, addCall, openDocument } = useAppStore();
  const isOpen = activeModal?.type === 'report-upload';
  const clientId = isOpen ? activeModal.clientId : '';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transcriptContent, setTranscriptContent] = useState('');
  const [transcriptFileName, setTranscriptFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportPlaudTemplate | null>(null);
  const [addedEvents, setAddedEvents] = useState<Set<string>>(new Set());
  const [addedDeliverables, setAddedDeliverables] = useState<Set<string>>(new Set());
  const [generatingBrief, setGeneratingBrief] = useState(false);

  const deliverables = useAppStore((s) => s.deliverables).filter((d) => d.clientId === clientId);
  const calls = useAppStore((s) => s.calls).filter((c) => c.clientId === clientId);

  const eventKey = (ev: { type: string; label: string; date: string }) => `${ev.type}-${ev.label}-${ev.date}`;
  const isEventInStore = (ev: { type: string; label: string; date: string }) =>
    ev.type === 'deliverable'
      ? deliverables.some((d) => d.name === ev.label && sameDay(d.dueDate, ev.date))
      : calls.some((c) => c.title === ev.label && sameDay(c.scheduledAt, ev.date));
  const isDeliverableInStore = (name: string) => deliverables.some((d) => d.name === name);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTranscriptContent(reader.result as string);
      setTranscriptFileName(file.name);
      setAnalyzeError(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleAnalyze = async () => {
    if (!transcriptContent.trim() || !clientId) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch('/api/analyze-plaud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptContent }),
      });
      const data = (await res.json()) as ReportPlaudTemplate & { error?: string };
      if (!res.ok || data.error) {
        setAnalyzeError(data.error ?? "Erreur lors de l'analyse.");
        return;
      }
      const { error: _e, ...doc } = data;
      const docWithRaw = { ...doc, rawTranscript: transcriptContent.trim() };
      await addDocument(clientId, { type: 'report', title: docWithRaw.title, content: JSON.stringify(docWithRaw) });
      setReportData(doc);
    } catch {
      setAnalyzeError("Impossible de contacter l'API. Verifie ta connexion.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddEvent = (ev: { type: 'deliverable' | 'call'; label: string; date: string }) => {
    if (!clientId || isEventInStore(ev)) return;
    const dateStr = ev.date.includes('T') ? ev.date : `${ev.date}T12:00:00`;
    const d = new Date(dateStr);
    if (ev.type === 'deliverable') {
      addDeliverable({
        clientId,
        name: ev.label,
        dueDate: d,
        inBacklog: false,
        type: 'other',
        status: 'to_quote',
        billingStatus: 'pending',
      });
    } else {
      addCall({ clientId, title: ev.label, scheduledAt: d, duration: 30, notes: '' });
    }
    setAddedEvents((prev) => new Set(prev).add(eventKey(ev)));
  };

  const handleAddDeliverable = (name: string, type: 'creative' | 'document' | 'other') => {
    if (!clientId || isDeliverableInStore(name)) return;
    addDeliverable({
      clientId,
      name,
      type,
      status: 'to_quote',
      billingStatus: 'pending',
    });
    setAddedDeliverables((prev) => new Set(prev).add(name));
  };

  const handleGenerateBrief = async () => {
    if (!transcriptContent.trim() || !clientId) return;
    setGeneratingBrief(true);
    try {
      const res = await fetch('/api/brief-from-plaud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawTranscript: transcriptContent.trim() }),
      });
      const data = (await res.json()) as { brief?: string; error?: string };
      if (!res.ok || data.error) {
        setAnalyzeError(data.error ?? 'Erreur lors de la génération du brief.');
        return;
      }
      const briefContent = data.brief ?? '';
      const createdDoc = await addDocument(clientId, {
        type: 'brief',
        title: `Brief - ${reportData?.title ?? 'Plaud'}`,
        content: briefContent,
      });
      handleClose();
      toast.success('Brief généré', {
        action: { label: 'Voir le brief', onClick: () => openDocument(createdDoc) },
      });
    } catch {
      setAnalyzeError('Impossible de générer le brief.');
    } finally {
      setGeneratingBrief(false);
    }
  };

  const handleClose = () => {
    setReportData(null);
    setTranscriptContent('');
    setTranscriptFileName('');
    setAddedEvents(new Set());
    setAddedDeliverables(new Set());
    setAnalyzeError(null);
    closeModal();
  };

  const typeStyle = getDocumentTypeStyle('report');

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={reportData ? 'Report enregistre' : 'Report Plaud'}
      subtitle="Report"
      icon={<PlaudLogo className="w-5 h-5" />}
      iconBg={typeStyle.bg}
      iconColor={typeStyle.text}
      size={reportData ? 'xl' : 'md'}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {reportData && (
            <button
              type="button"
              onClick={handleGenerateBrief}
              disabled={generatingBrief}
              className="px-4 py-2 rounded-xl bg-[var(--accent-violet)]/15 border border-[var(--accent-violet)]/30 text-sm font-semibold text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generatingBrief ? (
                <>
                  <span className="w-3 h-3 border-2 border-[var(--accent-violet)]/30 border-t-[var(--accent-violet)] rounded-full animate-spin" />
                  Génération…
                </>
              ) : (
                <>
                  <Sparkle />
                  Brief Créatif →
                </>
              )}
            </button>
          )}
          <Button onClick={handleClose}>
            {reportData ? 'Fermer' : 'Annuler'}
          </Button>
        </div>
      }
    >
      {!reportData ? (
        /* ═══════════════════════════════════════════════════════════════
           ECRAN UPLOAD (avant analyse)
        ═══════════════════════════════════════════════════════════════ */
        <div className="space-y-5">
          <input ref={fileInputRef} type="file" accept=".txt,.md,text/plain,text/markdown" onChange={handleFile} className="hidden" />
          
          {/* Zone upload fichier */}
          {transcriptFileName ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--accent-lime)]/10 border border-[var(--accent-lime)]/30">
              <span className="w-10 h-10 rounded-xl bg-[var(--accent-lime)]/20 flex items-center justify-center text-[var(--accent-lime)]">
                <FileCheck />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{transcriptFileName}</p>
                <p className="text-xs text-[var(--accent-lime)]">Pret a analyser</p>
              </div>
              <button
                type="button"
                onClick={() => { setTranscriptContent(''); setTranscriptFileName(''); }}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/10 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 rounded-2xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-amber)]/50 hover:bg-[var(--accent-amber)]/5 transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="w-14 h-14 rounded-2xl bg-[var(--bg-tertiary)] group-hover:bg-[var(--accent-amber)]/15 flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent-amber)] transition-colors">
                  <Upload />
                </span>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Deposer un fichier Plaud</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">.txt ou .md exporte depuis l'app</p>
                </div>
              </div>
            </button>
          )}

          {/* Separateur */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">ou</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Zone texte */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Coller la transcription</label>
            <textarea
              value={transcriptContent}
              onChange={(e) => { setTranscriptContent(e.target.value); setAnalyzeError(null); }}
              placeholder="Colle ici le texte de la reunion Plaud..."
              className="w-full h-32 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-amber)]/50 focus:ring-2 focus:ring-[var(--accent-amber)]/10 transition-all"
            />
          </div>

          {/* Bouton analyser */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !transcriptContent.trim()}
            className="w-full py-3 px-6 rounded-xl bg-[var(--accent-cyan)] text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[var(--accent-cyan)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkle />
                Analyser avec Claude
              </>
            )}
          </button>

          {/* Erreur */}
          {analyzeError && (
            <div className="p-3 rounded-xl bg-[var(--accent-coral)]/10 border border-[var(--accent-coral)]/30">
              <p className="text-sm text-[var(--accent-coral)]">{analyzeError}</p>
            </div>
          )}

          {/* Info */}
          <p className="text-[11px] text-[var(--text-muted)] text-center leading-relaxed">
            L'IA genere un rapport structure avec des suggestions d'evenements et livrables.
          </p>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           ECRAN RESULTAT (apres analyse) - 2 colonnes
        ═══════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* COLONNE GAUCHE : Synthese */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-[var(--accent-amber)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Synthese</h3>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] space-y-4">
              <h4 className="text-base font-semibold text-[var(--text-primary)] leading-snug">{reportData.title}</h4>

              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-tertiary)]">
                  <Calendar />
                  {formatDateFr(reportData.date)}
                </span>
                {reportData.duration != null && (
                  <span className="text-[var(--text-muted)]">{reportData.duration} min</span>
                )}
              </div>

              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{reportData.summary}</p>

              {reportData.keyPoints.length > 0 && (
                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Points cles</p>
                  <ul className="space-y-1.5">
                    {reportData.keyPoints.slice(0, 5).map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="mt-1.5 text-[var(--accent-amber)]"><Sparkle /></span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE : A ajouter */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-[var(--accent-lime)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">A ajouter</h3>
            </div>

            {/* Evenements */}
            {reportData.suggestedEvents && reportData.suggestedEvents.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Calendar />
                  Evenements timeline
                </p>
                <ul className="space-y-2">
                  {reportData.suggestedEvents.map((ev, i) => {
                    const key = eventKey(ev);
                    const added = addedEvents.has(key) || isEventInStore(ev);
                    const isCall = ev.type === 'call';
                    return (
                      <li
                        key={i}
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
                          added
                            ? 'bg-[var(--accent-lime)]/5 border-[var(--accent-lime)]/30'
                            : 'bg-[var(--bg-tertiary)]/60 border-[var(--border-subtle)] hover:border-[var(--accent-lime)]/40'
                        }`}
                      >
                        <span
                          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                            isCall
                              ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]'
                              : 'bg-[var(--accent-violet)]/15 text-[var(--accent-violet)]'
                          }`}
                        >
                          {isCall ? <Phone /> : <Package />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ev.label}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{formatDateFr(ev.date)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddEvent(ev)}
                          disabled={added}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            added
                              ? 'bg-[var(--accent-lime)]/20 text-[var(--accent-lime)] cursor-default'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent-lime)]/20 hover:text-[var(--accent-lime)]'
                          }`}
                        >
                          {added ? <Check /> : 'Ajouter'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Livrables */}
            {reportData.suggestedDeliverables && reportData.suggestedDeliverables.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Package />
                  Livrables (backlog)
                </p>
                <ul className="space-y-2">
                  {reportData.suggestedDeliverables.map((s, i) => {
                    const added = addedDeliverables.has(s.name) || isDeliverableInStore(s.name);
                    return (
                      <li
                        key={i}
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
                          added
                            ? 'bg-[var(--accent-lime)]/5 border-[var(--accent-lime)]/30'
                            : 'bg-[var(--bg-tertiary)]/60 border-[var(--border-subtle)] hover:border-[var(--accent-lime)]/40'
                        }`}
                      >
                        <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]">
                          <Package />
                        </span>
                        <p className="flex-1 min-w-0 text-sm font-medium text-[var(--text-primary)] truncate">{s.name}</p>
                        <button
                          type="button"
                          onClick={() => handleAddDeliverable(s.name, s.type)}
                          disabled={added}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            added
                              ? 'bg-[var(--accent-lime)]/20 text-[var(--accent-lime)] cursor-default'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent-lime)]/20 hover:text-[var(--accent-lime)]'
                          }`}
                        >
                          {added ? <Check /> : 'Ajouter'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Aucune suggestion */}
            {(!reportData.suggestedEvents?.length && !reportData.suggestedDeliverables?.length) && (
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]/40 border border-dashed border-[var(--border-subtle)] text-center">
                <p className="text-sm text-[var(--text-muted)]">Aucune suggestion detectee.<br/>Le document est enregistre dans la fiche client.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
