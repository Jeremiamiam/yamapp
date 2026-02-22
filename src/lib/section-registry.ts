/**
 * Registre : mapping SectionRole → composant Layout.
 * Utilisé pour validation, rendu preview et future cohérence agents ↔ layouts.
 */

import type { ComponentType } from 'react';
import type { SectionRole } from '@/types/section-zoning';
import { LayoutNavbar } from '@/components/layouts/LayoutNavbar';
import { LayoutHero } from '@/components/layouts/LayoutHero';
import { LayoutValueProp } from '@/components/layouts/LayoutValueProp';
import { LayoutServicesTeaser } from '@/components/layouts/LayoutServicesTeaser';
import { LayoutFeatures } from '@/components/layouts/LayoutFeatures';
import { LayoutSocialProof } from '@/components/layouts/LayoutSocialProof';
import { LayoutTestimonial } from '@/components/layouts/LayoutTestimonial';
import { LayoutPricing } from '@/components/layouts/LayoutPricing';
import { LayoutFaq } from '@/components/layouts/LayoutFaq';
import { LayoutCtaFinal } from '@/components/layouts/LayoutCtaFinal';
import { LayoutContactForm } from '@/components/layouts/LayoutContactForm';
import { LayoutFooter } from '@/components/layouts/LayoutFooter';
import { CUSTOM_LAYOUTS } from './custom-layouts';

export interface LayoutComponentProps {
  content?: Record<string, unknown>;
  intent?: string;
}

const LayoutNavbarWrapper: ComponentType<LayoutComponentProps> = LayoutNavbar as ComponentType<LayoutComponentProps>;

export const SECTION_TO_LAYOUT: Record<SectionRole, ComponentType<LayoutComponentProps>> = {
  navbar: LayoutNavbarWrapper,
  hero: LayoutHero,
  value_proposition: LayoutValueProp,
  services_teaser: LayoutServicesTeaser,
  solutions_overview: LayoutServicesTeaser,
  features: LayoutFeatures,
  social_proof: LayoutSocialProof,
  testimonial: LayoutTestimonial,
  pricing: LayoutPricing,
  faq: LayoutFaq,
  cta_final: LayoutCtaFinal,
  contact_form: LayoutContactForm,
  footer: LayoutFooter,
};

/**
 * Map des alias courants produits par les agents IA vers les rôles existants.
 * Permet de matcher "testimonials" → "testimonial", etc.
 */
export const ROLE_SIMILARITY_MAP: Record<string, SectionRole> = {
  about: 'value_proposition',
  team: 'social_proof',
  our_services: 'services_teaser',
  service_list: 'services_teaser',
  testimonials: 'testimonial',
  reviews: 'testimonial',
  stats: 'features',
  numbers: 'features',
  process: 'features',
  methodology: 'features',
  portfolio: 'social_proof',
  case_studies: 'social_proof',
  contact: 'contact_form',
  cta: 'cta_final',
  call_to_action: 'cta_final',
};

/**
 * Résultat du matching de layout avec fallback.
 */
export interface LayoutMatchResult {
  layout: ComponentType<LayoutComponentProps> | null;
  matched: SectionRole | null;
  isExact: boolean;
}

/**
 * Retourne le composant Layout pour un rôle donné avec matching intelligent.
 * 1. Essai d'abord le match exact dans SECTION_TO_LAYOUT.
 * 2. Essai via ROLE_SIMILARITY_MAP pour les alias IA courants.
 * 3. Retourne { layout: null, matched: null, isExact: false } si rien ne matche.
 */
export function getLayoutForRoleWithFallback(role: string): LayoutMatchResult {
  // 1. Match exact
  if (role in SECTION_TO_LAYOUT) {
    return {
      layout: SECTION_TO_LAYOUT[role as SectionRole],
      matched: role as SectionRole,
      isExact: true,
    };
  }

  // 1.5 Check custom layouts (AI-generated)
  if (role in CUSTOM_LAYOUTS) {
    return { layout: CUSTOM_LAYOUTS[role], matched: null, isExact: true };
  }

  // 2. Match via similarity map (case-insensitive)
  const normalizedRole = role.toLowerCase();
  if (normalizedRole in ROLE_SIMILARITY_MAP) {
    const mappedRole = ROLE_SIMILARITY_MAP[normalizedRole];
    return {
      layout: SECTION_TO_LAYOUT[mappedRole],
      matched: mappedRole,
      isExact: false,
    };
  }

  // 3. Aucun match
  return { layout: null, matched: null, isExact: false };
}

/**
 * Retourne le composant Layout pour un rôle donné.
 * Si le rôle n'est pas reconnu, retourne null (fallback).
 * @deprecated Préférer getLayoutForRoleWithFallback pour le rendu preview.
 */
export function getLayoutForRole(role: string): ComponentType<LayoutComponentProps> | null {
  if (role in SECTION_TO_LAYOUT) {
    return SECTION_TO_LAYOUT[role as SectionRole];
  }
  return null;
}

/**
 * Vérifie si un rôle est valide (présent dans le registre).
 */
export function isValidSectionRole(role: string): role is SectionRole {
  return role in SECTION_TO_LAYOUT;
}

/**
 * Retourne la liste de tous les layouts disponibles, groupés en "standard" et "custom".
 * Exclut navbar et footer (pas pertinents en tant que sections éditables).
 */
export function getAvailableLayouts(): { role: string; label: string; group: 'standard' | 'custom' }[] {
  const standard = Object.keys(SECTION_TO_LAYOUT)
    .filter(r => r !== 'navbar' && r !== 'footer')
    .map(r => ({ role: r, label: humanizeRole(r), group: 'standard' as const }));
  const custom = Object.keys(CUSTOM_LAYOUTS)
    .map(r => ({ role: r, label: humanizeRole(r), group: 'custom' as const }));
  return [...standard, ...custom];
}

function humanizeRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}
