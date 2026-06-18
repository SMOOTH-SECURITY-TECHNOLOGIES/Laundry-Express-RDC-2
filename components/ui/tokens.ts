/**
 * Design System Tokens — Mobile-first
 *
 * Couleurs standardisées :
 *   vert  = livré / OK / succès
 *   bleu  = assigné / en cours / primaire
 *   orange = retard / attention
 *   rouge = incident / échec / danger
 *
 * Usage : import { STATUS_COLORS, SPACING, TYPO } from './tokens'
 */

/* ─── Status Colors ─── */
export const STATUS_COLORS = {
  /** Vert : livré, OK, succès */
  success: {
    bg: 'bg-green-100 dark:bg-green-950/40',
    bgSolid: 'bg-green-500',
    text: 'text-green-700 dark:text-green-300',
    textSolid: 'text-white',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    ring: 'ring-green-100 dark:ring-green-900/40',
  },
  /** Bleu : assigné, en cours, primaire */
  info: {
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    bgSolid: 'bg-brand-blue',
    text: 'text-blue-700 dark:text-blue-300',
    textSolid: 'text-white',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-brand-blue',
    ring: 'ring-blue-100 dark:ring-blue-900/40',
  },
  /** Orange : retard, attention */
  warning: {
    bg: 'bg-orange-100 dark:bg-orange-950/40',
    bgSolid: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    textSolid: 'text-white',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
    ring: 'ring-orange-100 dark:ring-orange-900/40',
  },
  /** Rouge : incident, échec, danger */
  danger: {
    bg: 'bg-red-100 dark:bg-red-950/40',
    bgSolid: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    textSolid: 'text-white',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    ring: 'ring-red-100 dark:ring-red-900/40',
  },
  /** Neutre : inactif, brouillon */
  neutral: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    bgSolid: 'bg-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    textSolid: 'text-white',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
    ring: 'ring-slate-100 dark:ring-slate-800',
  },
} as const;

export type StatusTone = keyof typeof STATUS_COLORS;

/* ─── Mission Status Mapping ─── */
export const MISSION_STATUS_MAP: Record<string, StatusTone> = {
  pending: 'warning',
  open_market: 'warning',
  claimed: 'info',
  driver_assigned: 'info',
  accepted: 'info',
  in_progress: 'info',
  completed: 'success',
  delivered: 'success',
  failed: 'danger',
  cancelled: 'danger',
  expired: 'danger',
  delayed: 'warning',
  assigned: 'info',
  in_transit: 'info',
  incident: 'danger',
};

/* ─── Typography (mobile-optimized) ─── */
export const TYPO = {
  /** Titre de page mobile */
  pageTitle: 'text-xl font-black tracking-tight text-content-primary',
  /** Titre de section mobile */
  sectionTitle: 'text-base font-black text-content-primary',
  /** Sous-titre / description */
  sectionSubtitle: 'text-sm text-content-muted',
  /** Label de champ / micro */
  label: 'text-[10px] font-bold uppercase tracking-wide text-content-muted',
  /** Valeur principale (KPI, montant) */
  value: 'text-2xl font-black text-content-primary',
  /** Valeur petite (badge, chip) */
  valueSm: 'text-sm font-black',
  /** Texte de carte */
  cardTitle: 'text-sm font-black text-content-primary',
  cardBody: 'text-xs text-content-muted',
  /** Bouton */
  btn: 'text-sm font-black',
  btnSm: 'text-xs font-black',
  /** Chip / Tag */
  chip: 'text-[10px] font-black uppercase',
} as const;

/* ─── Spacing (mobile-optimized 4px grid) ─── */
export const SPACING = {
  /** Espace entre cartes */
  cardGap: 'gap-3',
  /** Espace interne carte */
  cardPad: 'p-4',
  /** Espace interne carte grande */
  cardPadLg: 'p-5',
  /** Espace section */
  sectionGap: 'space-y-4',
  /** Espace petit (entre éléments) */
  gapSm: 'gap-2',
  /** Espace micro */
  gapXs: 'gap-1.5',
} as const;

/* ─── Border Radius ─── */
export const RADIUS = {
  /** Cartes */
  card: 'rounded-2xl',
  /** Petit éléments (pills, chips) */
  pill: 'rounded-full',
  /** Boutons */
  btn: 'rounded-2xl',
  /** Images / avatars */
  avatar: 'rounded-full',
  /** Éléments internes */
  inner: 'rounded-xl',
} as const;

/* ─── Shadows ─── */
export const SHADOW = {
  card: 'shadow-card',
  elevated: 'shadow-lg',
  none: '',
} as const;

/* ─── Touch Targets (Apple HIG / Material) ─── */
export const TOUCH = {
  /** Taille minimale bouton */
  minBtn: 'min-h-[48px]',
  /** Taille bouton d'action principale */
  minBtnLg: 'min-h-[52px]',
  /** Taille petit bouton */
  minBtnSm: 'min-h-[40px]',
  /** Largeur minimale */
  minW: 'min-w-[48px]',
} as const;

/* ─── Card Presets ─── */
export const CARD = {
  base: 'rounded-2xl border border-surface-border-subtle bg-surface-card shadow-card',
  interactive: 'rounded-2xl border border-surface-border-subtle bg-surface-card shadow-card transition active:scale-[0.98]',
  muted: 'rounded-2xl bg-surface-muted',
  alert: 'rounded-2xl border p-4',
} as const;

/* ─── Animations ─── */
export const ANIM = {
  /** Fade in */
  fadeIn: 'animate-fade-in',
  /** Slide up from bottom */
  slideUp: 'animate-slide-up',
  /** Scale in */
  scaleIn: 'animate-scale-in',
  /** Pulse */
  pulse: 'animate-pulse',
  /** Spin */
  spin: 'animate-spin',
  /** Bounce */
  bounce: 'animate-bounce',
} as const;

/* ─── Transitions ─── */
export const TRANSITION = {
  /** Transition rapide (150ms) */
  fast: 'transition-all duration-150 ease-out',
  /** Transition normale (200ms) */
  normal: 'transition-all duration-200 ease-out',
  /** Transition lente (300ms) */
  slow: 'transition-all duration-300 ease-out',
  /** Transition de scale */
  scale: 'transition-transform duration-150 ease-out active:scale-95',
  /** Transition d'opacité */
  opacity: 'transition-opacity duration-200 ease-out',
} as const;
