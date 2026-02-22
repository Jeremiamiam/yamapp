/**
 * Wiki data — source de vérité pour la documentation in-app.
 *
 * ⚠️  CONVENTION POUR LES AGENTS CODING :
 * Quand tu ajoutes/modifies une feature ou un agent IA, mets à jour ce fichier.
 * - Nouvelle feature → ajouter dans FEATURE_SECTIONS
 * - Nouvel agent Creative Board → ajouter dans CREATIVE_BOARD_AGENTS
 * - Nouvel agent Web Brief → ajouter dans WEB_BRIEF_AGENTS
 * - Nouvel agent PLAUD → ajouter dans PLAUD_AGENTS
 * - Nouvelle étape pipeline → ajouter dans PIPELINE_STEPS
 */

// ── Types ──────────────────────────────────────────────

export interface FeatureSection {
  id: string;
  title: string;
  /** CSS variable, ex: 'var(--accent-cyan)' */
  color: string;
  /** Nom de l'icône (résolu côté composant) */
  icon: string;
  description: string;
  actions: string[];
}

export interface AgentInfo {
  name: string;
  role: string;
  color: string;
  emoji: string;
  hasWebSearch?: boolean;
}

export interface AgentPhase {
  phase: string;
  label: string;
  agents: AgentInfo[];
}

export interface PipelineStep {
  emoji: string;
  label: string;
  sub: string;
  color: string;
}

// ── Features de l'app ──────────────────────────────────

export const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 'calendrier',
    title: 'Calendrier',
    color: 'var(--accent-cyan)',
    icon: 'calendar',
    description: 'Timeline horizontale avec vue semaine. Visualisez livrables et calls sur une frise temps avec navigation par dates.',
    actions: [
      'Filtrer par membre d\u2019équipe ou statut client',
      'Naviguer semaine par semaine avec les flèches',
      'Cliquer sur un événement pour voir le détail',
      'Vue compacte ou étendue (toggle)',
    ],
  },
  {
    id: 'production',
    title: 'Production',
    color: 'var(--accent-lime)',
    icon: 'kanban',
    description: 'Kanban de suivi des livrables par statut. Glissez les cartes entre colonnes pour mettre à jour l\u2019avancement.',
    actions: [
      'Créer un livrable avec client, date, assignation',
      'Déplacer entre colonnes (drag & drop)',
      'Suivre la facturation par livrable',
      'Filtrer par client ou membre',
    ],
  },
  {
    id: 'clients',
    title: 'Clients',
    color: 'var(--accent-violet)',
    icon: 'users',
    description: 'Liste en grille de tous les clients et prospects. Accédez aux fiches détaillées avec contacts, liens et documents.',
    actions: [
      'Ajouter un client ou prospect',
      'Gérer les contacts (CRUD complet)',
      'Ajouter des liens externes (site, drive\u2026)',
      'Accéder aux documents du client',
    ],
  },
  {
    id: 'documents',
    title: 'Documents',
    color: 'var(--accent-amber)',
    icon: 'file-text',
    description: 'Création et gestion de documents : briefs, reports PLAUD, notes. Édition riche en modale avec sauvegarde auto.',
    actions: [
      'Créer un brief, un report ou une note',
      'Éditer avec le contenu riche (markdown)',
      'Lire en modale plein écran',
      'Associer à un client',
    ],
  },
  {
    id: 'compta',
    title: 'Comptabilité',
    color: 'var(--accent-coral)',
    icon: 'chart',
    description: 'KPIs financiers, facturation par client et historique. Filtrage par année. Réservé aux administrateurs.',
    actions: [
      'Voir les KPIs (entrées, sorties, solde)',
      'Détail facturation par client',
      'Filtrer par année',
      'Accès réservé admin',
    ],
  },
  {
    id: 'backlog-todos',
    title: 'Backlog & Todos',
    color: 'var(--accent-violet)',
    icon: 'check-square',
    description: 'Drawer backlog pour les items non planifiés et todo du jour. Gardez un œil sur ce qui reste à faire.',
    actions: [
      'Ouvrir le drawer backlog (items sans date)',
      'Gérer les todos du jour',
      'Assigner à un membre',
      'Marquer comme fait',
    ],
  },
  {
    id: 'equipe-roles',
    title: 'Équipe & Rôles',
    color: 'var(--text-secondary)',
    icon: 'shield',
    description: 'Gestion des rôles Admin vs Member. Les admins accèdent à la compta et aux paramètres avancés.',
    actions: [
      'Admin : accès compta, settings, CRUD docs',
      'Member : accès lecture, navigation standard',
      'Gérer les rôles dans /settings',
    ],
  },
  {
    id: 'retroplanning',
    title: 'Retroplanning IA',
    color: 'var(--accent-amber)',
    icon: 'calendar-range',
    description: 'Génère un retroplanning Gantt à partir d\u2019un brief et d\u2019une deadline. L\u2019IA lit le brief, déduit les étapes adaptées au type de projet et calcule les dates en remontant depuis la deadline.',
    actions: [
      'Générer un retroplanning depuis un brief client',
      'Visualiser sous forme de diagramme Gantt interactif',
      'Modifier les tâches (label, durée, couleur)',
      'Sauvegarder en base (upsert par client)',
      'Supprimer le retroplanning d\u2019un client',
    ],
  },
  {
    id: 'raccourcis',
    title: 'Raccourcis & Navigation',
    color: 'var(--text-muted)',
    icon: 'navigation',
    description: 'Naviguez rapidement entre les vues avec le clavier ou les gestes tactiles sur mobile.',
    actions: [
      '\u2190 \u2192 Flèches : changer de vue',
      '\u2318\u21e7D : ouvrir le Wiki',
      'Bottom nav sur mobile (5 onglets)',
      'Scroll horizontal sur la timeline',
    ],
  },
];

// ── Creative Board — Agents par phase ──────────────────

export const CREATIVE_BOARD_AGENTS: AgentPhase[] = [
  {
    phase: '1',
    label: 'Stratégie & Idéation',
    agents: [
      { name: 'Le Stratège', role: 'Analyse le marché, la concurrence et les tendances via recherche web. Définit la tension stratégique.', color: 'var(--accent-cyan)', emoji: '\ud83c\udfaf', hasWebSearch: true },
      { name: 'Le Concepteur', role: 'Génère 10-15 directions créatives à partir de la tension. Chaque idée a un titre et un angle.', color: 'var(--accent-lime)', emoji: '\ud83d\udca1' },
      { name: 'Le Scorer', role: 'Note chaque idée sur 100 (alignement 40pts, différenciation 30pts, faisabilité 30pts). Retourne le top 5 avec flags (CLICHÉ, TROP VAGUE\u2026).', color: 'var(--accent-amber)', emoji: '\ud83c\udfc6' },
    ],
  },
  {
    phase: '2',
    label: 'Plateforme & Validation',
    agents: [
      { name: "L'Architecte", role: 'Construit la plateforme de marque : battlefield, hero & villain, identité (archetype, promesse), matrice d\u2019expression, manifeste.', color: 'var(--accent-violet)', emoji: '\ud83c\udfd7\ufe0f' },
      { name: 'Le Copywriter', role: 'Traduit la stratégie en langage de marque : territoire de ton, manifeste (5-7 lignes), 3 taglines candidates.', color: 'var(--accent-magenta)', emoji: '\u270d\ufe0f' },
      { name: "L'Avocat du diable", role: 'Challenge le travail : audit bullshit, risques de perception, menaces concurrentielles. Pose 2 questions client.', color: 'var(--accent-coral)', emoji: '\ud83d\ude08' },
      { name: 'Yam', role: 'Touche finale du directeur créatif : accroches, concepts visuels, micro-risques créatifs.', color: 'var(--accent-lime)', emoji: '\u2728' },
    ],
  },
  {
    phase: '3',
    label: 'Validation automatique',
    agents: [
      { name: "L'Auditeur", role: 'Vérifie les faits via recherche web, attribue un score de confiance (0-100) à chaque section. Flags : HYPOTHÈSE, BULLSHIT POTENTIEL\u2026', color: 'var(--text-secondary)', emoji: '\ud83d\udd0d', hasWebSearch: true },
    ],
  },
];

// ── Web Brief — Agents séquentiels ─────────────────────

export const WEB_BRIEF_AGENTS: AgentInfo[] = [
  { name: 'Web Architect', role: 'Définit l\u2019arborescence du site (pages, navigation, footer). Max 8 pages primaires + user flows.', color: 'var(--accent-magenta)', emoji: '\ud83d\uddfa\ufe0f' },
  { name: 'Homepage', role: 'Génère la structure homepage : hero \u2192 value prop \u2192 services \u2192 social proof \u2192 témoignage \u2192 CTA final. Tous les CTAs pointent vers les slugs du menu.', color: 'var(--accent-cyan)', emoji: '\ud83c\udfe0' },
  { name: 'Page Zoning', role: 'Crée le zoning section par section pour chaque page. 14 rôles prédéfinis (hero, pricing, FAQ, contact\u2026). Contenu réel, pas de lorem ipsum.', color: 'var(--accent-lime)', emoji: '\ud83d\udccf' },
  { name: 'Section Rewrite', role: 'Réécrit une section individuelle avec un prompt custom. Respecte la structure menu et le ton de marque.', color: 'var(--accent-amber)', emoji: '\u270f\ufe0f' },
  { name: 'SMM Brief', role: 'Stratégie réseaux sociaux : piliers de contenu, stratégie par canal (Instagram, LinkedIn, TikTok\u2026), hashtags.', color: 'var(--accent-violet)', emoji: '\ud83d\udce3' },
];

// ── PLAUD — Agents transcription ───────────────────────

export const PLAUD_AGENTS: AgentInfo[] = [
  { name: 'Analyze PLAUD', role: 'Transcrit et analyse un enregistrement de réunion : participants, résumé, points clés, actions, prochaines étapes, dates extraites, livrables suggérés.', color: 'var(--accent-cyan)', emoji: '\ud83c\udfa4' },
  { name: 'Brief from PLAUD', role: 'Transforme la transcription en brief créatif structuré. Lance une recherche web parallèle (paysage concurrentiel + tendances marché) pour enrichir le brief.', color: 'var(--accent-lime)', emoji: '\ud83d\udcdd', hasWebSearch: true },
];

// ── Pipeline complet (vue macro) ───────────────────────

export const PIPELINE_STEPS: PipelineStep[] = [
  { emoji: '\ud83c\udfa4', label: 'PLAUD', sub: 'Transcription', color: 'var(--accent-cyan)' },
  { emoji: '\ud83d\udcdd', label: 'Brief', sub: '+ recherche web', color: 'var(--accent-lime)' },
  { emoji: '\u2728', label: 'Creative Board', sub: '7 agents \u00d7 3 styles', color: 'var(--accent-lime)' },
  { emoji: '\ud83d\uddfa\ufe0f', label: 'Architecture', sub: 'Arborescence site', color: 'var(--accent-magenta)' },
  { emoji: '\ud83d\udccf', label: 'Zoning', sub: 'Sections par page', color: 'var(--accent-magenta)' },
  { emoji: '\ud83d\udce3', label: 'SMM', sub: 'Réseaux sociaux', color: 'var(--accent-violet)' },
  { emoji: '\ud83d\udcc5', label: 'Retroplanning', sub: 'Gantt depuis brief', color: 'var(--accent-amber)' },
];

// ── Section roles (pour page zoning) ───────────────────

export const SECTION_ROLES = [
  'hero', 'value_proposition', 'services_teaser', 'features',
  'social_proof', 'testimonial', 'pricing', 'faq',
  'contact_form', 'cta_final', 'team', 'process',
  'gallery', 'blog_preview',
] as const;

// ── Styles créatifs ────────────────────────────────────

export const CREATIVE_STYLES = [
  { name: 'Corporate', desc: 'Professionnel, analytique, institutionnel', color: 'var(--accent-cyan)' },
  { name: 'Audacieux', desc: 'Visionnaire, provocation contrôlée, bold', color: 'var(--accent-lime)' },
  { name: 'Subversif', desc: 'Direct, provocateur, challenge les codes', color: 'var(--accent-coral)' },
] as const;
