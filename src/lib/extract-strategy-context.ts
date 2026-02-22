/**
 * Extrait le contexte stratégique (plateforme de marque, copy, report) depuis les documents d'un client.
 * Utilisé pour alimenter page-zoning et autres agents web.
 */

import type { ClientDocument } from '@/types';
import type { CreativeBriefTemplate, ReportPlaudTemplate } from '@/types/document-templates';
import { isCreativeBriefTemplate, parseStructuredDocument } from '@/types/document-templates';

export interface StrategyContext {
  reportContent: string;
  brandPlatform: unknown;
  copywriterText: string;
}

function parseReportContent(doc: ClientDocument): string {
  try {
    const parsed = JSON.parse(doc.content) as ReportPlaudTemplate;
    if (parsed?.version === 1) {
      const parts: string[] = [];
      if (parsed.summary) parts.push(`Résumé: ${parsed.summary}`);
      if (parsed.keyPoints?.length) {
        parts.push(`Points clés: ${parsed.keyPoints.join(' ; ')}`);
      }
      if (parsed.rawTranscript) {
        parts.push(`Transcription (extrait): ${parsed.rawTranscript.slice(0, 2000)}`);
      }
      return parts.join('\n\n');
    }
  } catch {
    // Fallback: contenu brut
  }
  return doc.content.slice(0, 4000);
}

function parseCreativeStrategyContent(doc: ClientDocument): Partial<StrategyContext> | null {
  try {
    const parsed = JSON.parse(doc.content) as { version?: number; architect?: unknown; strategist?: unknown; copywriter?: unknown };
    if (parsed?.version === 2) {
      const platform = parsed.architect ?? null;
      let strategyText = '';
      let copywriterText = '';
      if (parsed.strategist) {
        const s = parsed.strategist as { sections?: { heading: string; body: string; quote?: string }[] };
        strategyText = Array.isArray(s.sections)
          ? s.sections.map((sec) => `### ${sec.heading}\n${sec.body}${sec.quote ? `\n> ${sec.quote}` : ''}`).join('\n\n')
          : String(parsed.strategist);
      }
      if (parsed.copywriter) {
        const c = parsed.copywriter as { territory?: string; manifesto?: string; taglines?: { text: string }[] };
        copywriterText = [c.territory, c.manifesto, (c.taglines ?? []).map((t) => `- ${t.text}`).join('\n')]
          .filter(Boolean)
          .join('\n\n');
      }
      return {
        brandPlatform: platform,
        copywriterText: strategyText ? `${strategyText}\n\n${copywriterText}` : copywriterText,
      };
    }
  } catch {
    // Markdown / texte brut — on garde le contenu
  }
  return null;
}

/**
 * Extrait le contexte stratégique depuis les documents du client.
 * Priorité : creative-strategy (le plus récent) pour brandPlatform/copywriter,
 * report (le plus récent) pour reportContent.
 */
export function extractStrategyContext(documents: ClientDocument[]): StrategyContext {
  const result: StrategyContext = {
    reportContent: '',
    brandPlatform: undefined,
    copywriterText: '',
  };

  const byType = documents.reduce((acc, d) => {
    (acc[d.type] ??= []).push(d);
    return acc;
  }, {} as Record<string, ClientDocument[]>);

  // Report : le plus récent
  const reports = (byType['report'] ?? []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  if (reports[0]) {
    result.reportContent = parseReportContent(reports[0]);
  }

  // Creative-strategy : le plus récent
  const strategies = (byType['creative-strategy'] ?? []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  if (strategies[0]) {
    const extracted = parseCreativeStrategyContent(strategies[0]);
    if (extracted) {
      result.brandPlatform = extracted.brandPlatform ?? result.brandPlatform;
      result.copywriterText = extracted.copywriterText ?? result.copywriterText;
    }
  }

  // Fallback : brief créatif (CreativeBriefTemplate) — texte brut ou structuré
  const briefs = (byType['brief'] ?? []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  if (briefs[0] && !result.reportContent) {
    try {
      const parsed = parseStructuredDocument(briefs[0].content, 'brief');
      if (parsed && isCreativeBriefTemplate(parsed)) {
        const brief = parsed as CreativeBriefTemplate;
        result.reportContent = [
          `Marque: ${brief.marque}`,
          `Cible: ${brief.cible}`,
          `Projet: ${brief.projet}`,
          `Problème: ${brief.vraiProbleme}`,
          `Ambition: ${brief.ambition}`,
        ].join('\n');
      } else {
        result.reportContent = briefs[0].content.slice(0, 4000);
      }
    } catch {
      result.reportContent = briefs[0].content.slice(0, 4000);
    }
  }

  return result;
}
