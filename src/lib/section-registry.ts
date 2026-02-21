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
 * Retourne le composant Layout pour un rôle donné.
 * Si le rôle n'est pas reconnu, retourne null (fallback).
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
