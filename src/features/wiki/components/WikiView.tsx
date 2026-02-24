'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { LayoutGallery } from '@/features/layout-gallery/components/LayoutGallery';
import { WikiPromptsSection } from './WikiPromptsSection';
import {
  FEATURE_SECTIONS,
  CREATIVE_BOARD_AGENTS,
  WEB_BRIEF_AGENTS,
  PLAUD_AGENTS,
  RETROPLANNING_AGENTS,
  PIPELINE_STEPS,
  SECTION_ROLES,
  CREATIVE_STYLES,
  type FeatureSection,
} from '../wiki-data';

// ── Types ──────────────────────────────────────────────
interface YamDoc {
  id: string;
  title: string;
  url: string;
  sort_order: number;
}

// ── SVG Icons ──────────────────────────────────────────
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const KanbanIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="8" rx="1"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const LayoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const CheckSquareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const NavigationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);
const CalendarRangeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="17"/><line x1="12" y1="14" x2="12" y2="17"/><line x1="16" y1="14" x2="16" y2="17"/>
  </svg>
);
const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

// ── Icon resolver ──────────────────────────────────────
const LayoutGridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const Settings2Icon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4"/><path d="M20 12H4"/><path d="M20 17H4"/>
    <circle cx="9" cy="7" r="2.5" fill="var(--bg-card)" stroke="currentColor" strokeWidth="2"/>
    <circle cx="15" cy="12" r="2.5" fill="var(--bg-card)" stroke="currentColor" strokeWidth="2"/>
    <circle cx="9" cy="17" r="2.5" fill="var(--bg-card)" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const ICON_MAP: Record<string, React.ReactNode> = {
  'calendar': <CalendarIcon />,
  'calendar-range': <CalendarRangeIcon />,
  'kanban': <KanbanIcon />,
  'users': <UsersIcon />,
  'file-text': <FileTextIcon />,
  'chart': <ChartIcon />,
  'check-square': <CheckSquareIcon />,
  'shield': <ShieldIcon />,
  'navigation': <NavigationIcon />,
  'layout': <LayoutIcon />,
  'layout-grid': <LayoutGridIcon />,
  'sparkle': <SparkleIcon />,
  'link': <LinkIcon />,
  'settings2': <Settings2Icon />,
};

function resolveIcon(icon: string): React.ReactNode {
  return ICON_MAP[icon] || <SparkleIcon />;
}

// ── Agent flow component ───────────────────────────────
function AgentFlowSection() {
  return (
    <div id="section-agents-ia" className="col-span-full">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="h-1 rounded-t-xl" style={{ backgroundColor: 'var(--accent-lime)' }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-lime)', opacity: 0.15 }}>
              <span style={{ color: 'var(--accent-lime)' }}><SparkleIcon /></span>
            </span>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Creative Board &mdash; Agents IA</h3>
              <p className="text-xs text-[var(--text-muted)]">Tous les agents tournent sur Claude Sonnet 4 &middot; 3 styles disponibles : Corporate, Audacieux, Subversif</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Orchestration multi-agents en 3 phases. Chaque agent a un prompt d&eacute;di&eacute; par style.
            L&apos;utilisateur s&eacute;lectionne une id&eacute;e entre la phase 1 et 2. La phase 3 (audit) est automatique.
          </p>

          {/* Phase flow */}
          <div className="space-y-6">
            {CREATIVE_BOARD_AGENTS.map((phase) => (
              <div key={phase.phase}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-lime)]/15 text-[var(--accent-lime)] text-xs font-bold flex items-center justify-center">
                    {phase.phase}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{phase.label}</span>
                  {phase.phase === '1' && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] font-medium">
                      S&eacute;lection utilisateur apr&egrave;s cette phase
                    </span>
                  )}
                </div>
                <div className="grid gap-2">
                  {phase.agents.map((agent, i) => (
                    <div key={agent.name} className="flex items-start gap-3 relative">
                      {/* Connector line */}
                      {i < phase.agents.length - 1 && (
                        <div className="absolute left-[15px] top-[32px] bottom-[-8px] w-px bg-[var(--border-subtle)]" />
                      )}
                      {/* Agent dot */}
                      <div className="flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm z-10" style={{ backgroundColor: agent.color + '22' }}>
                        {agent.emoji}
                      </div>
                      {/* Agent info */}
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{agent.name}</span>
                          {agent.hasWebSearch && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] font-medium">web search</span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{agent.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Styles info */}
          <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">3 styles cr&eacute;atifs</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CREATIVE_STYLES.map((style) => (
                <div key={style.name} className="px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30">
                  <span className="text-xs font-semibold" style={{ color: style.color }}>{style.name}</span>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{style.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebBriefAgentsSection() {
  return (
    <div id="section-web-brief" className="col-span-full">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="h-1 rounded-t-xl" style={{ backgroundColor: 'var(--accent-magenta)' }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-magenta)', opacity: 0.15 }}>
              <span style={{ color: 'var(--accent-magenta)' }}><LayoutIcon /></span>
            </span>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Web Brief &mdash; Pipeline IA</h3>
              <p className="text-xs text-[var(--text-muted)]">Du Creative Board au site web complet, en passant par le zoning de chaque page</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Cha&icirc;ne s&eacute;quentielle : les sorties du Creative Board (plateforme de marque, strat&eacute;gie, copy) alimentent chaque agent web.
            L&apos;architecture d&eacute;finit les pages, puis chaque page est zon&eacute;e individuellement. Les CTAs pointent automatiquement vers les slugs du menu.
          </p>

          {/* Agent pipeline */}
          <div className="grid gap-2">
            {WEB_BRIEF_AGENTS.map((agent, i) => (
              <div key={agent.name} className="flex items-start gap-3 relative">
                {i < WEB_BRIEF_AGENTS.length - 1 && (
                  <div className="absolute left-[15px] top-[32px] bottom-[-8px] w-px bg-[var(--border-subtle)]" />
                )}
                <div className="flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm z-10" style={{ backgroundColor: agent.color + '22' }}>
                  {agent.emoji}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{agent.name}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{agent.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Section roles */}
          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">14 r&ocirc;les de section disponibles</p>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_ROLES.map((role) => (
                <span key={role} className="text-[10px] px-2 py-1 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)] font-mono">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaudAgentsSection() {
  return (
    <div id="section-plaud" className="col-span-full">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="h-1 rounded-t-xl" style={{ backgroundColor: 'var(--accent-cyan)' }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-cyan)', opacity: 0.15 }}>
              <span style={{ color: 'var(--accent-cyan)' }}><FileTextIcon /></span>
            </span>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">PLAUD &mdash; Transcription IA</h3>
              <p className="text-xs text-[var(--text-muted)]">De l&apos;enregistrement audio au brief cr&eacute;atif enrichi</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Deux agents transforment un enregistrement PLAUD en brief cr&eacute;atif actionnable.
            Le second lance une recherche web parall&egrave;le (25s) pour enrichir le contexte concurrentiel et les tendances march&eacute;.
          </p>

          <div className="grid gap-2">
            {PLAUD_AGENTS.map((agent, i) => (
              <div key={agent.name} className="flex items-start gap-3 relative">
                {i < PLAUD_AGENTS.length - 1 && (
                  <div className="absolute left-[15px] top-[32px] bottom-[-8px] w-px bg-[var(--border-subtle)]" />
                )}
                <div className="flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm z-10" style={{ backgroundColor: agent.color + '22' }}>
                  {agent.emoji}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{agent.name}</span>
                    {agent.hasWebSearch && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] font-medium">web search</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{agent.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Output info */}
          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Donn&eacute;es extraites</p>
            <div className="flex flex-wrap gap-1.5">
              {['participants', 'r\u00e9sum\u00e9', 'points cl\u00e9s', 'actions', 'dates', 'livrables sugg\u00e9r\u00e9s', 'marque', 'cible', 'tension', 'concurrence', 'tendances'].map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Full pipeline overview ─────────────────────────────
function PipelineOverview() {
  const steps = PIPELINE_STEPS;

  return (
    <div id="section-pipeline" className="col-span-full">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="h-1 rounded-t-xl bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-lime)] to-[var(--accent-magenta)]" />
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Pipeline IA complet</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-5">De l&apos;enregistrement client au site web + strat&eacute;gie sociale &mdash; tout est g&eacute;n&eacute;r&eacute; par IA.</p>

          {/* Horizontal pipeline */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-1 flex-shrink-0">
                <div className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 min-w-[90px]">
                  <span className="text-lg">{step.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: step.color }}>{step.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)] text-center leading-tight">{step.sub}</span>
                </div>
                {i < steps.length - 1 && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[var(--text-muted)] opacity-40">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Liens utiles sidebar (CRUD from Supabase) ─────────
function LiensUtilesSidebar() {
  const { isAdmin } = useUserRole();
  const [docs, setDocs] = useState<YamDoc[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadDocs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('yam_docs')
          .select('*')
          .order('sort_order', { ascending: true });
        if (cancelled) return;
        if (error) {
          console.warn('Table yam_docs non trouvée:', error.message);
          setDocs([]);
        } else {
          setDocs(data || []);
        }
      } catch (err) {
        console.error('Erreur chargement yam_docs:', err);
        if (!cancelled) setDocs([]);
      } finally {
        if (!cancelled) setHasLoaded(true);
      }
    };
    loadDocs();
    return () => { cancelled = true; };
  }, []);

  const handleAdd = async () => {
    if (!formTitle.trim() || !formUrl.trim()) return;
    try {
      const supabase = createClient();
      const newDoc = { id: `doc-${Date.now()}`, title: formTitle.trim(), url: formUrl.trim(), sort_order: docs.length };
      const { error } = await supabase.from('yam_docs').insert(newDoc);
      if (error) throw error;
      setDocs([...docs, newDoc]);
      setFormTitle(''); setFormUrl(''); setIsAdding(false);
    } catch (err) { console.error('Erreur ajout doc:', err); }
  };

  const handleEdit = (id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (doc) { setFormTitle(doc.title); setFormUrl(doc.url); setEditingId(id); setIsAdding(false); }
  };

  const handleUpdate = async () => {
    if (!editingId || !formTitle.trim() || !formUrl.trim()) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('yam_docs').update({ title: formTitle.trim(), url: formUrl.trim(), updated_at: new Date().toISOString() }).eq('id', editingId);
      if (error) throw error;
      setDocs(docs.map((d) => d.id === editingId ? { ...d, title: formTitle.trim(), url: formUrl.trim() } : d));
      setFormTitle(''); setFormUrl(''); setEditingId(null);
    } catch (err) { console.error('Erreur mise à jour doc:', err); }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('yam_docs').delete().eq('id', id);
      if (error) throw error;
      setDocs(docs.filter((d) => d.id !== id));
      if (editingId === id) { setEditingId(null); setFormTitle(''); setFormUrl(''); }
    } catch (err) { console.error('Erreur suppression doc:', err); }
  };

  const handleCancel = () => { setIsAdding(false); setEditingId(null); setFormTitle(''); setFormUrl(''); };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <div className="h-1 rounded-t-xl" style={{ backgroundColor: 'var(--accent-violet)' }} />
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-violet)', opacity: 0.15 }}>
            <span style={{ color: 'var(--accent-violet)' }}><LinkIcon /></span>
          </span>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Liens utiles</h3>
        </div>

        {!hasLoaded ? (
          <p className="text-xs text-[var(--text-muted)] py-3">Chargement...</p>
        ) : docs.length === 0 && !isAdding ? (
          <div className="py-3 text-center">
            <p className="text-xs text-[var(--text-muted)] mb-2">Aucun lien</p>
            {isAdmin && (
              <button onClick={() => setIsAdding(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 transition-colors text-xs font-medium">
                <PlusIcon /> Ajouter
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-1">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)] hover:text-[var(--accent-violet)] transition-colors truncate">
                  {doc.title}
                  <span className="flex-shrink-0 opacity-50"><ExternalLinkIcon /></span>
                </a>
                {isAdmin && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => handleEdit(doc.id)} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors" title="Modifier"><PencilIcon /></button>
                    <button onClick={() => handleDelete(doc.id)} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--accent-coral)]/10 hover:text-[var(--accent-coral)] transition-colors" title="Supprimer"><TrashIcon /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdmin && docs.length > 0 && !isAdding && !editingId && (
          <button onClick={() => setIsAdding(true)} className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <PlusIcon /> Ajouter un lien
          </button>
        )}

        {(isAdding || editingId) && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)]">
            <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              {editingId ? 'Modifier' : 'Nouveau lien'}
            </p>
            <div className="space-y-2">
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Titre" className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)]" autoFocus />
              <input type="url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://..." className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)]" />
              <div className="flex gap-2">
                <button onClick={handleCancel} className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors">Annuler</button>
                <button onClick={editingId ? handleUpdate : handleAdd} disabled={!formTitle.trim() || !formUrl.trim()} className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-violet)] text-white hover:bg-[var(--accent-violet)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {editingId ? 'OK' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Retroplanning agents section ───────────────────────
function RetroplanningAgentsSection() {
  return (
    <div id="section-retroplanning-agents" className="col-span-full">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="h-1 rounded-t-xl" style={{ backgroundColor: 'var(--accent-amber)' }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-amber)', opacity: 0.15 }}>
              <span style={{ color: 'var(--accent-amber)' }}><CalendarRangeIcon /></span>
            </span>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Retroplanning &mdash; Agent IA</h3>
              <p className="text-xs text-[var(--text-muted)]">G&eacute;n&egrave;re un Gantt depuis le brief, en remontant depuis la deadline</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Un seul agent analyse le brief du client (web-brief, brief, rapport ou strat&eacute;gie cr&eacute;ative)
            et g&eacute;n&egrave;re 4 &agrave; 10 &eacute;tapes projet adapt&eacute;es au type de mission.
            Les dates sont calcul&eacute;es en remontant depuis la deadline (&laquo;&nbsp;backward scheduling&nbsp;&raquo;).
          </p>

          <div className="grid gap-2">
            {RETROPLANNING_AGENTS.map((agent) => (
              <div key={agent.name} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: agent.color + '22' }}>
                  {agent.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{agent.name}</span>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{agent.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Ce que le Gantt permet</p>
            <div className="flex flex-wrap gap-1.5">
              {['drag-move', 'resize droite', 'formulaire d\'édition', 'couleur par étape', 'indicator aujourd\'hui', 'deadline marker'].map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature card ───────────────────────────────────────
function FeatureCard({ section }: { section: FeatureSection }) {
  return (
    <div id={`section-${section.id}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <div className="h-1 rounded-t-xl" style={{ backgroundColor: section.color }} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2 rounded-lg" style={{ backgroundColor: section.color, opacity: 0.15 }}>
            <span style={{ color: section.color }}>{resolveIcon(section.icon)}</span>
          </span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{section.title}</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">{section.description}</p>
        <ul className="space-y-1.5">
          {section.actions.map((action) => (
            <li key={action} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
              <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }} />
              {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Main WikiView ──────────────────────────────────────
export function WikiView() {
  const [galleryOpen, setGalleryOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navItems = [
    ...FEATURE_SECTIONS.map((s) => ({ id: s.id, label: s.title, color: s.color })),
    { id: 'pipeline', label: 'Pipeline IA', color: 'var(--accent-lime)' },
    { id: 'agents-ia', label: 'Creative Board IA', color: 'var(--accent-lime)' },
    { id: 'web-brief', label: 'Web Brief IA', color: 'var(--accent-magenta)' },
    { id: 'plaud', label: 'PLAUD', color: 'var(--accent-cyan)' },
    { id: 'retroplanning-agents', label: 'Retroplanning IA', color: 'var(--accent-amber)' },
    { id: 'prompts-ia', label: 'Prompts IA', color: 'var(--accent-violet)' },
  ];

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Main content — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1">
              Guide YAM Dashboard
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Vue d&apos;ensemble de toutes les fonctionnalit&eacute;s de l&apos;application.
            </p>
          </div>

          {/* Quick nav chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-colors"
                style={{ color: item.color, borderColor: item.color + '33' }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {FEATURE_SECTIONS.map((section) => (
              <FeatureCard key={section.id} section={section} />
            ))}
          </div>

          {/* Layout Gallery quick access */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-xl border border-[var(--accent-violet)]/30 bg-[var(--accent-violet)]/5 hover:bg-[var(--accent-violet)]/10 transition-colors group"
            >
              <span className="p-2 rounded-lg bg-[var(--accent-violet)]/15 text-[var(--accent-violet)] group-hover:bg-[var(--accent-violet)]/25 transition-colors">
                <LayoutGridIcon />
              </span>
              <div className="text-left">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">Ouvrir la galerie de layouts</span>
                <span className="block text-xs text-[var(--text-muted)]">Aperçus visuels de tous les layouts standard et custom</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--accent-violet)] transition-colors">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          {/* IA Section — full pipeline + agents detail */}
          <div className="mt-8 mb-2">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Intelligence Artificielle</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              12 agents IA orchestr&eacute;s sur Claude Sonnet 4, du brief client au site web complet.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            <PipelineOverview />
            <AgentFlowSection />
            <WebBriefAgentsSection />
            <PlaudAgentsSection />
            <RetroplanningAgentsSection />
            <WikiPromptsSection />
          </div>

          {/* Mobile only: liens utiles inline (below cards) */}
          <div className="mt-6 lg:hidden">
            <LiensUtilesSidebar />
          </div>

          <div className="h-6" />
        </div>
      </div>

      {/* Right sidebar — liens utiles, sticky, desktop only */}
      <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0 border-l border-[var(--border-subtle)] overflow-y-auto p-4">
        <div className="sticky top-0">
          <LiensUtilesSidebar />
        </div>
      </div>

      {/* Layout Gallery modal */}
      {galleryOpen && (
        <LayoutGallery
          isOpen
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}
