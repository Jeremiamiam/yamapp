/**
 * Schéma de zoning partagé entre agents et front.
 * Contrat unique : tout agent de zoning (homepage, page-zoning) produit des ZonedSection.
 */

export const SECTION_ROLES = [
  'navbar',
  'hero',
  'value_proposition',
  'services_teaser',
  'solutions_overview',
  'features',
  'social_proof',
  'testimonial',
  'pricing',
  'faq',
  'cta_final',
  'contact_form',
  'footer',
] as const;

export type SectionRole = (typeof SECTION_ROLES)[number];

export type SectionLayoutVariant = 'default' | 'split' | 'centered';

/**
 * Ce que tout agent de zoning produit pour une section.
 */
export interface ZonedSection {
  /** UUID stable — optionnel pour rétrocompat avec les sorties agents legacy. */
  id?: string;
  order: number;
  /** Rôle connu (SectionRole) ou rôle custom inventé par l'IA (ex: product_grid, blog_list).
   *  Les rôles custom s'affichent via LayoutPlaceholder avec option de générer le layout. */
  role: SectionRole | (string & {});
  intent?: string;
  content: Record<string, unknown>;
  layout?: SectionLayoutVariant;
  da_notes?: string;
}

/**
 * Schémas content par rôle (pour validation / typage).
 * Les agents doivent respecter ces structures.
 */
export interface HeroContent {
  title?: string;
  subtitle?: string;
  text?: string;
  cta_primary?: { label: string; url: string };
  cta_secondary?: { label: string; url: string };
}

export interface ValuePropositionContent {
  title?: string;
  text?: string;
  subtitle?: string;
  cta_primary?: { label: string; url: string };
  cta_secondary?: { label: string; url: string };
}

export interface ServicesTeaserContent {
  title?: string;
  text?: string;
  items?: { title?: string; text?: string; url?: string }[];
}

export interface TestimonialContent {
  title?: string;
  quotes?: { text?: string; author_name?: string; role?: string }[];
  single_quote?: { text?: string; author_name?: string };
}

export interface FaqContent {
  title?: string;
  items?: { question?: string; answer?: string }[];
}

export interface CtaContent {
  title?: string;
  text?: string;
  cta_primary?: { label: string; url: string };
  cta_secondary?: { label: string; url: string };
}
