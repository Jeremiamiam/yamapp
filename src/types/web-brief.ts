/**
 * Types pour les outputs des agents Web (Architecte Web + Homepage).
 * Utilisés pour le document web-brief stocké côté client.
 */

import type { ZonedSection } from './section-zoning';

export interface WebArchitectNavItem {
  page: string;
  slug: string;
  justification: string;
  priority?: 'high' | 'medium' | 'low';
  children?: { page: string; slug: string; justification: string }[];
}

/** Page ajoutée manuellement (hors architecture initiale). */
export interface AddedPage {
  page: string;
  slug: string;
  agent_brief: string;
}

export interface WebArchitectOutput {
  site_type: string;
  primary_objective: string;
  target_visitor: string;
  navigation: {
    primary: WebArchitectNavItem[];
    footer_only?: { page: string; slug: string; justification: string }[];
    /** Pages ajoutées à la main (hors archi initiale). */
    added_pages?: AddedPage[];
  };
  /** Bouton CTA affiché dans la navbar. */
  cta?: { label: string; visible: boolean };
  user_flows?: { persona: string; entry_point: string; flow: string[]; conversion_goal: string }[];
  content_dependencies?: string[];
  pages_rejected?: { page: string; reason: string }[];
}

/**
 * Section homepage — structure alignée sur ZonedSection.
 * role: string pour rétrocompat avec sorties agents.
 */
export interface HomepageSection {
  /** UUID stable — optionnel pour rétrocompat avec les sorties agents legacy. */
  id?: string;
  order: number;
  role: string;
  intent: string;
  content: Record<string, unknown>;
  layout?: ZonedSection['layout'];
  da_notes?: string;
}

export interface HomepageOutput {
  page: string;
  target_visitor: string;
  strategic_intent?: string; // conservé pour rétrocompat, non affiché
  narrative_arc?: string; // idem
  sections: HomepageSection[];
  cross_links?: { from_section: string; to_page: string; purpose: string }[];
  seo_notes?: {
    primary_keyword?: string;
    title_tag?: string;
    meta_description?: string;
  };
}

/**
 * Zoning d'une page (about, contact, etc.) générée à la volée.
 */
export interface PageOutput {
  page: string;
  slug: string;
  sections: ZonedSection[];
  target_visitor?: string;
}

export interface WebBriefData {
  version: 1;
  architecture: WebArchitectOutput;
  homepage: HomepageOutput;
  /** Pages supplémentaires (about, contact...) générées à la demande. slug → PageOutput */
  pages?: Record<string, PageOutput>;
  generatedAt: string; // ISO date
}
