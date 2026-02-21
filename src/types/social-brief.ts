/**
 * Types pour le Brief Social Media (SMM) — output de l'API smm-brief.
 * Généré à partir de la plateforme de marque et de la stratégie créative.
 */

export interface SocialContentPillar {
  title: string;
  description: string;
  contentIdeas?: string[];
}

export interface SocialChannelBrief {
  channel: string;
  objectives?: string[];
  tone?: string;
  postingFrequency?: string;
  contentSuggestions?: string[];
}

export interface SocialBriefData {
  version: 1;
  brandVoice?: string;
  content_pillars: SocialContentPillar[];
  channels: SocialChannelBrief[];
  hashtag_strategy?: string;
  generatedAt?: string;
}
