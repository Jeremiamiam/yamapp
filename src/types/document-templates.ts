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
}

export type StructuredDocument = BriefTemplate | ReportPlaudTemplate;

function isBriefTemplate(data: unknown): data is BriefTemplate {
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

function isReportPlaudTemplate(data: unknown): data is ReportPlaudTemplate {
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
): BriefTemplate | ReportPlaudTemplate | null {
  try {
    const data = JSON.parse(content) as unknown;
    if (type === 'brief' && isBriefTemplate(data)) return data;
    if (type === 'report' && isReportPlaudTemplate(data)) return data;
    return null;
  } catch {
    return null;
  }
}

export function isStructuredContent(content: string, type: 'brief' | 'report'): boolean {
  return parseStructuredDocument(content, type) !== null;
}
