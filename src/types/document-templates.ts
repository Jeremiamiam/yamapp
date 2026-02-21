// Templates JSON pour Brief et Report PLAUD — à respecter par l'IA en output

export interface BriefTemplate {
  version: 1;
  title: string;
  clientContext?: string;
  objectives: string[];
  targetAudience?: string;
  deliverables: string[];
  constraints?: string;
  tone?: string;
  references?: string;
  deadline?: string;
  notes?: string;
}

/** Brief créatif issu de brief-from-plaud (transcription → JSON structuré) */
export interface CreativeBriefTemplate {
  version: 1;
  marque: string;
  personnalitePerque?: string;
  cible: string;
  tensionComportementale?: string;
  projet: string;
  vraiProbleme: string;
  contexteConcurrentiel: string;
  contraintes: string;
  ambition: string;
  /** Ton interdit explicitement (ex: "corporate froid, site-vitrine catalogue, mignons") */
  tonInterdit?: string;
  /** Supports / canaux mentionnés (ex: ["site web", "LinkedIn", "Meta", "salons B2B", "cartes de visite"]) */
  supports?: string[];
  /** Contraintes opérationnelles (ex: "associés = matière première, agence doit équiper templates/guides") */
  contraintesOperationnelles?: string;
  /** Angle secteur ou opportunité manquante (ex: "une marque qui assume compétence technique + authenticité humaine") */
  angleSecteur?: string;
  /** Phase 1 Brief Intelligence : paysage concurrentiel enrichi par recherche web */
  competitiveLandscape?: {
    resume: string;
    concurrents?: { nom: string; positioning?: string }[];
    tendances?: string[];
    sources?: string[];
  };
  /** Phase 1 : segments cibles détaillés */
  targetSegments?: {
    segment: string;
    besoin?: string;
    objection?: string;
  }[];
}

export interface ReportPlaudTemplate {
  version: 1;
  title: string;
  date: string;
  duration?: number;
  participants?: string[];
  summary: string;
  keyPoints: string[];
  actionItems: { text: string; assignee?: string }[];
  nextSteps?: string;
  transcriptionExcerpt?: string;
  suggestedDeliverables?: { name: string; type: 'creative' | 'document' | 'other' }[];
  /** Dates de rendu ou de call détectées dans la réunion — pour poser direct sur la timeline */
  suggestedEvents?: { type: 'deliverable' | 'call'; label: string; date: string }[];
  /** Clés des événements déjà ajoutés à la timeline (persisté pour rétroactivité après refresh) */
  addedEventKeys?: string[];
  /** Transcription brute conservée pour alimenter le Creative Board */
  rawTranscript?: string;
}

export type StructuredDocument = BriefTemplate | ReportPlaudTemplate | CreativeBriefTemplate;

export function isBriefTemplate(data: unknown): data is BriefTemplate {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    typeof d.title === 'string' &&
    Array.isArray(d.objectives) &&
    d.objectives.every((x: unknown) => typeof x === 'string') &&
    Array.isArray(d.deliverables) &&
    d.deliverables.every((x: unknown) => typeof x === 'string')
  );
}

export function isCreativeBriefTemplate(data: unknown): data is CreativeBriefTemplate {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    typeof d.marque === 'string' &&
    typeof d.cible === 'string' &&
    typeof d.projet === 'string' &&
    typeof d.vraiProbleme === 'string' &&
    typeof d.contexteConcurrentiel === 'string' &&
    typeof d.contraintes === 'string' &&
    typeof d.ambition === 'string'
  );
}

export function isReportPlaudTemplate(data: unknown): data is ReportPlaudTemplate {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    typeof d.title === 'string' &&
    typeof d.date === 'string' &&
    typeof d.summary === 'string' &&
    Array.isArray(d.keyPoints) &&
    d.keyPoints.every((x: unknown) => typeof x === 'string') &&
    Array.isArray(d.actionItems) &&
    d.actionItems.every(
      (x: unknown) =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as { text: string }).text === 'string'
    )
  );
}

export function parseStructuredDocument(
  content: string,
  type: 'brief' | 'report'
): BriefTemplate | CreativeBriefTemplate | ReportPlaudTemplate | null {
  try {
    const data = JSON.parse(content) as unknown;
    if (type === 'brief' && isBriefTemplate(data)) return data;
    if (type === 'brief' && isCreativeBriefTemplate(data)) return data;
    if (type === 'report' && isReportPlaudTemplate(data)) return data;
    return null;
  } catch {
    return null;
  }
}

export function isStructuredContent(content: string, type: 'brief' | 'report'): boolean {
  return parseStructuredDocument(content, type) !== null;
}

/** Formate un CreativeBriefTemplate en texte riche pour le Creative Board (style BRIEF 1) */
export function creativeBriefToBoardInput(brief: CreativeBriefTemplate): string {
  const sections: string[] = [];
  const add = (label: string, val: string | string[] | undefined) => {
    if (val == null || val === '') return;
    const body = Array.isArray(val) ? val.map((v) => `• ${v}`).join('\n') : val;
    sections.push(`${label}\n${body}`);
  };
  add('MARQUE', brief.marque);
  if (brief.personnalitePerque) add('PERSONNALITÉ PERÇUE', brief.personnalitePerque);
  add('CIBLE', brief.cible);
  if (brief.tensionComportementale) add('TENSION COMPORTEMENTALE', brief.tensionComportementale);
  add('PROJET', brief.projet);
  add('LE VRAI PROBLÈME', brief.vraiProbleme);
  add('CONTEXTE CONCURRENTIEL', brief.contexteConcurrentiel);
  add('CONTRAINTES', brief.contraintes);
  add('AMBITION', brief.ambition);
  if (brief.tonInterdit) add('TON INTERDIT', brief.tonInterdit);
  if (brief.supports?.length) add('SUPPORTS', brief.supports);
  if (brief.contraintesOperationnelles) add('CONTRAINTES OPÉRATIONNELLES', brief.contraintesOperationnelles);
  if (brief.angleSecteur) add('ANGLE SECTEUR', brief.angleSecteur);
  return sections.join('\n\n---\n\n');
}
