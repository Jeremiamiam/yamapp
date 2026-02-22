/**
 * Convertisseur document → Markdown pour export.
 * Gère tous les types : note, brief, report, creative-strategy, web-brief, social-brief.
 */

import type { ClientDocument } from '@/types';
import {
  isBriefTemplate,
  isCreativeBriefTemplate,
  type BriefTemplate,
  type CreativeBriefTemplate,
} from '@/types/document-templates';

function mdSection(title: string, body: string): string {
  if (!body?.trim()) return '';
  return `## ${title}\n\n${body.trim()}\n\n`;
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function toIsoDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function sanitizeFilename(title: string, suffix: string): string {
  const safe = title.replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '_').slice(0, 80);
  return `${safe || 'document'}-${suffix}.md`;
}

/** Génère un nom de fichier unique pour un document (ex. brief-2025-01-15.md) */
export function documentFilename(doc: ClientDocument): string {
  const dateStr = toIsoDate(doc.createdAt);
  const slug = doc.type.replace(/\s+/g, '-');
  return sanitizeFilename(doc.title, `${slug}-${dateStr}`);
}

/** Télécharge un document en Markdown (fichier .md) */
export function downloadDocumentAsMarkdown(doc: ClientDocument): void {
  const md = documentToMarkdown(doc);
  const filename = documentFilename(doc);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Télécharge tous les documents d'un client en ZIP (fichiers .md) */
export async function downloadDocumentsAsZip(
  documents: ClientDocument[],
  clientName: string
): Promise<void> {
  if (documents.length === 0) return;
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (const doc of documents) {
    const md = documentToMarkdown(doc);
    const filename = documentFilename(doc);
    zip.file(filename, md);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const safe = clientName.replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '_').slice(0, 60);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `documents-${safe}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Convertit un ClientDocument en Markdown */
export function documentToMarkdown(doc: ClientDocument): string {
  const header = `# ${doc.title}\n\n*${doc.type} — ${formatDate(doc.createdAt)}*\n\n---\n\n`;
  let body = '';

  try {
    const data = JSON.parse(doc.content) as unknown;
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      switch (doc.type) {
        case 'note':
          body = doc.content;
          break;
        case 'brief':
          body = isBriefTemplate(data)
            ? briefTemplateToMd(data)
            : isCreativeBriefTemplate(data)
              ? creativeBriefToMd(d)
              : genericJsonToMd(d);
          break;
        case 'report':
          body = reportToMd(d);
          break;
        case 'creative-strategy':
          body = creativeStrategyToMd(d);
          break;
        case 'web-brief':
          body = webBriefToMd(d);
          break;
        case 'social-brief':
          body = socialBriefToMd(d);
          break;
        case 'link':
          body = `[${doc.title}](${doc.content})`;
          break;
        default:
          body = doc.content;
      }
    } else {
      body = doc.content;
    }
  } catch {
    body = doc.content;
  }

  return header + (body || doc.content);
}

function briefTemplateToMd(b: BriefTemplate): string {
  const parts: string[] = [];
  if (b.clientContext) parts.push(mdSection('Contexte client', b.clientContext));
  if (b.objectives?.length) parts.push('## Objectifs\n\n' + b.objectives.map((o) => `- ${o}`).join('\n') + '\n\n');
  if (b.targetAudience) parts.push(mdSection('Cible', b.targetAudience));
  if (b.deliverables?.length) parts.push('## Produits\n\n' + b.deliverables.map((d) => `- ${d}`).join('\n') + '\n\n');
  if (b.constraints) parts.push(mdSection('Contraintes', b.constraints));
  const meta: string[] = [];
  if (b.deadline) meta.push(`Échéance : ${b.deadline}`);
  if (b.tone) meta.push(`Ton : ${b.tone}`);
  if (b.references) meta.push(`Références : ${b.references}`);
  if (b.notes) meta.push(b.notes);
  if (meta.length) parts.push('\n' + meta.join(' | ') + '\n');
  return parts.join('\n');
}

function creativeBriefToMd(d: Record<string, unknown>): string {
  const parts: string[] = [];
  const add = (label: string, val: unknown) => {
    if (val === undefined || val === null) return;
    if (typeof val === 'string') parts.push(`**${label}** : ${val}`);
    else if (Array.isArray(val)) parts.push(`**${label}** :\n${val.map((v) => `- ${v}`).join('\n')}`);
    else parts.push(`**${label}** : ${JSON.stringify(val)}`);
  };
  add('Marque', d.marque);
  add('Personnalité perçue', d.personnalitePerque);
  add('Cible', d.cible);
  add('Tension comportementale', d.tensionComportementale);
  add('Projet', d.projet);
  add('Vrai problème', d.vraiProbleme);
  add('Contexte concurrentiel', d.contexteConcurrentiel);
  add('Contraintes', d.contraintes);
  add('Ambition', d.ambition);
  add('Ton interdit', d.tonInterdit);
  add('Supports', d.supports);
  add('Objectifs', d.objectives);
  add('Livrables', d.deliverables);
  add('Délai', d.deadline);
  add('Notes', d.notes);
  if (d.competitiveLandscape && typeof d.competitiveLandscape === 'object') {
    const cl = d.competitiveLandscape as Record<string, unknown>;
    parts.push(`**Paysage concurrentiel** : ${String(cl.resume ?? '')}`);
  }
  return parts.join('\n\n');
}

function genericJsonToMd(d: Record<string, unknown>): string {
  return JSON.stringify(d, null, 2);
}

function reportToMd(d: Record<string, unknown>): string {
  const parts: string[] = [];
  parts.push(mdSection('Résumé', String(d.summary ?? '')));
  const kp = d.keyPoints as string[] | undefined;
  if (kp?.length) {
    parts.push('## Points clés\n\n' + kp.map((p) => `- ${p}`).join('\n') + '\n');
  }
  const ai = d.actionItems as { text: string; assignee?: string }[] | undefined;
  if (ai?.length) {
    parts.push('## Actions\n\n' + ai.map((a) => `- ${a.text}${a.assignee ? ` (${a.assignee})` : ''}`).join('\n') + '\n');
  }
  if (d.nextSteps) parts.push(mdSection('Prochaines étapes', String(d.nextSteps)));
  return parts.join('\n');
}

function creativeStrategyToMd(d: Record<string, unknown>): string {
  const parts: string[] = [];
  const strat = d.strategist;
  if (strat) {
    if (typeof strat === 'object' && strat !== null && 'sections' in strat) {
      const sections = (strat as { sections?: { heading: string; body: string; quote?: string }[] }).sections ?? [];
      parts.push('## Tension stratégique\n\n' + sections.map((s) => `### ${s.heading}\n\n${s.body}${s.quote ? `\n\n> ${s.quote}` : ''}`).join('\n\n') + '\n');
    } else {
      parts.push('## Tension stratégique\n\n' + String(strat) + '\n');
    }
  }
  const idea = d.selectedIdea as { title?: string; body?: string } | undefined;
  if (idea?.title) {
    parts.push('## Angle retenu\n\n**' + idea.title + '**\n\n' + (idea.body || '') + '\n');
  }
  const arch = d.architect;
  if (arch) {
    parts.push('## Plateforme de Marque\n\n' + (typeof arch === 'object' ? JSON.stringify(arch, null, 2) : String(arch)) + '\n');
  }
  const copy = d.copywriter;
  if (copy && typeof copy === 'object') {
    const c = copy as { territory?: string; manifesto?: string; taglines?: { text: string; note?: string }[] };
    parts.push('## Territoire & Copy\n\n' + (c.territory ?? '') + '\n\n**Manifeste**\n\n' + (c.manifesto ?? '') + '\n\n**Taglines**\n\n' + (c.taglines ?? []).map((t) => `- ${t.text}`).join('\n') + '\n');
  }
  const dev = d.devil;
  if (dev && typeof dev === 'object') {
    const dv = dev as { points?: string[]; questions?: { question: string; piste: string }[] };
    parts.push('## Points de vigilance\n\n' + (dv.points ?? []).map((p) => `- ${p}`).join('\n') + '\n\n');
    if (dv.questions?.length) {
      parts.push('**Questions client**\n\n' + dv.questions.map((q) => `- ${q.question}\n  Piste : ${q.piste}`).join('\n\n') + '\n');
    }
  }
  const yam = d.yam;
  if (yam && typeof yam === 'object') {
    const y = yam as { touches?: { concept?: string; visuel?: string; accroche?: string; pourquoi?: string }[]; commentaire?: string };
    if (y.touches?.length) {
      parts.push('## Touche Yam\n\n' + y.touches.map((t) => {
        let out = `**${t.accroche ?? ''}**`;
        if (t.concept) out += `\n\nConcept : ${t.concept}`;
        if (t.visuel) out += `\n\nVisuel : ${t.visuel}`;
        if (t.pourquoi) out += `\n\nPourquoi : ${t.pourquoi}`;
        return out;
      }).join('\n\n---\n\n') + '\n');
    }
    if (y.commentaire) parts.push(y.commentaire + '\n');
  }
  return parts.join('\n');
}

function webBriefToMd(d: Record<string, unknown>): string {
  const parts: string[] = [];
  const arch = d.architecture as Record<string, unknown> | undefined;
  if (arch) {
    parts.push('## Architecture\n\n');
    parts.push(`**Type** : ${arch.site_type ?? ''}\n`);
    parts.push(`**Objectif** : ${arch.primary_objective ?? ''}\n`);
    parts.push(`**Cible** : ${arch.target_visitor ?? ''}\n\n`);
    const nav = arch.navigation as { primary?: { page: string; slug: string; justification?: string }[]; footer_only?: { page: string; slug: string }[] } | undefined;
    if (nav?.primary?.length) {
      parts.push('### Navigation\n\n' + nav.primary.map((i) => `- **${i.page}** /${i.slug} — ${i.justification ?? ''}`).join('\n') + '\n');
    }
  }
  const home = d.homepage as Record<string, unknown> | undefined;
  if (home) {
    parts.push('## Homepage\n\n');
    parts.push(`**Objectif** : ${home.strategic_intent ?? ''}\n`);
    parts.push(`**Arc narratif** : ${home.narrative_arc ?? ''}\n\n`);
    const sections = (home.sections ?? []) as { order?: number; role: string; intent: string; content: Record<string, unknown> }[];
    sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const s of sections) {
      const c = s.content ?? {};
      const title = (c.title ?? c.section_title ?? s.role) as string;
      parts.push(`### ${s.role} — ${title}\n\n`);
      parts.push(`*${s.intent}*\n\n`);
      if (c.text) parts.push(String(c.text) + '\n\n');
      if (c.subtitle) parts.push(String(c.subtitle) + '\n\n');
    }
  }
  return parts.join('\n');
}

function socialBriefToMd(d: Record<string, unknown>): string {
  const parts: string[] = [];
  if (d.brandVoice) parts.push('## Voix de marque\n\n' + String(d.brandVoice) + '\n\n');
  const pillars = d.content_pillars as { title: string; description: string; contentIdeas?: string[] }[] | undefined;
  if (pillars?.length) {
    parts.push('## Piliers de contenu\n\n');
    for (const p of pillars) {
      parts.push(`### ${p.title}\n\n${p.description}\n`);
      if (p.contentIdeas?.length) parts.push('- ' + p.contentIdeas.join('\n- ') + '\n');
      parts.push('\n');
    }
  }
  const channels = d.channels as { channel: string; objectives?: string[]; tone?: string; postingFrequency?: string; contentSuggestions?: string[] }[] | undefined;
  if (channels?.length) {
    parts.push('## Canaux\n\n');
    for (const ch of channels) {
      parts.push(`### ${ch.channel}\n\n`);
      if (ch.objectives?.length) parts.push('**Objectifs** : ' + ch.objectives.join(', ') + '\n');
      if (ch.tone) parts.push('**Ton** : ' + ch.tone + '\n');
      if (ch.postingFrequency) parts.push('**Fréquence** : ' + ch.postingFrequency + '\n');
      if (ch.contentSuggestions?.length) parts.push('- ' + ch.contentSuggestions.join('\n- ') + '\n');
      parts.push('\n');
    }
  }
  if (d.hashtag_strategy) parts.push('## Stratégie hashtags\n\n' + String(d.hashtag_strategy) + '\n');
  return parts.join('\n');
}
