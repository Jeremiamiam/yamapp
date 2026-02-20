/**
 * Types pour les outputs des agents Web (Architecte Web + Homepage).
 * Utilisés pour le document web-brief stocké côté client.
 */

export interface WebArchitectNavItem {
  page: string;
  slug: string;
  justification: string;
  priority?: 'high' | 'medium' | 'low';
  children?: { page: string; slug: string; justification: string }[];
}

export interface WebArchitectOutput {
  site_type: string;
  primary_objective: string;
  target_visitor: string;
  navigation: {
    primary: WebArchitectNavItem[];
    footer_only?: { page: string; slug: string; justification: string }[];
  };
  user_flows?: { persona: string; entry_point: string; flow: string[]; conversion_goal: string }[];
  content_dependencies?: string[];
  pages_rejected?: { page: string; reason: string }[];
}

export interface HomepageSection {
  order: number;
  role: string;
  intent: string;
  content: Record<string, unknown>;
  da_notes?: string;
}

export interface HomepageOutput {
  page: string;
  strategic_intent: string;
  target_visitor: string;
  narrative_arc?: string;
  sections: HomepageSection[];
  cross_links?: { from_section: string; to_page: string; purpose: string }[];
  seo_notes?: {
    primary_keyword?: string;
    title_tag?: string;
    meta_description?: string;
  };
}

export interface WebBriefData {
  version: 1;
  architecture: WebArchitectOutput;
  homepage: HomepageOutput;
  generatedAt: string; // ISO date
}
