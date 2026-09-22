/**
 * Kinotchi Semantic Pet-State API
 *
 * Public exports
 * ──────────────
 *  PetStateKind          — union of all 11 canonical semantic state names
 *  PetStateMeta          — visual / semantic metadata for one state
 *  PET_STATE_REGISTRY    — Record<PetStateKind, PetStateMeta>
 *  resolvePetState()     — safe runtime resolver; invalid → healthy
 *  resolveWithAliases()  — same, expands PET_STATE_ALIASES first
 *  PET_STATE_ALIASES     — identity + synonym map for all 11 states
 *  CARE_CHAIN_PAIRINGS   — five need → positive → healthy tuples (visual only)
 *  DISTINCTION_PAIRS     — ten exactly-requested distinction pairs
 *  PetStateDisplay       — React component: actual pet sprite + state chrome
 *
 *  Re-exported from kinotchi.tsx (no duplication):
 *  PetKind, EmotionKind  — canonical vocabulary types
 *
 * Design rules
 * ────────────
 *  - Imports PetSprite, PetKind, EmotionKind from kinotchi.tsx (canonical).
 *  - Reuses existing kino-em-* / kino-anim-* CSS classes; adds kino-state-*.
 *  - Invalid runtime strings fall back to healthy without throwing.
 *  - TypeScript strict throughout; no `any`.
 *  - Contains visual semantics only; consuming applications own state logic.
 *  - Consumers own all state transitions; this module owns only visual metadata.
 *  - No emoji glyphs; environment effects use SVG geometric accents.
 */

// ---------------------------------------------------------------------------
// Re-exports from canonical source (no duplication)
// ---------------------------------------------------------------------------

export type { PetKind, EmotionKind } from '../preview/kinotchi';
export { PetSprite } from '../preview/kinotchi';

import { PetSprite } from '../preview/kinotchi';
import type { PetKind, EmotionKind } from '../preview/kinotchi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** All 11 canonical semantic pet states */
export type PetStateKind =
  | 'healthy'
  | 'sick'
  | 'recovering'
  | 'hungry'
  | 'nourished'
  | 'messy'
  | 'relieved'
  | 'tired'
  | 'rested'
  | 'bored'
  | 'engaged';

/** Broad physical posture of the pet in this state */
export type PostureKind = 'upright' | 'slouch' | 'droop' | 'perk' | 'float';

/** Energy tier — describes visible animation liveliness */
export type EnergyTier = 'high' | 'medium' | 'low' | 'critical';

/**
 * Ambient environment effect that may accompany this state.
 * Consumers may suppress effects independently (showEffect={false}).
 */
export type EnvironmentEffect =
  | 'none'
  | 'sparkles'
  | 'zzz'
  | 'drool'
  | 'sick-cross'
  | 'hearts'
  | 'stink';

/** Full visual + semantic metadata for one canonical pet state */
export type PetStateMeta = {
  /** Canonical state identifier */
  kind: PetStateKind;
  /** Title-case human-readable name */
  label: string;
  /** Emotional meaning and visible purpose */
  emotion: string;
  /** Neutral visual pairing guidance (no product/game specifics) */
  pairingGuidance: string;
  /** Which EmotionKind face treatment to render */
  face: EmotionKind;
  /** Broad physical posture */
  posture: PostureKind;
  /** Visible animation energy tier */
  energy: EnergyTier;
  /** CSS class for the body idle animation (applied continuously) */
  idleAnimClass: string;
  /** CSS class for the one-shot entry transition (remove after completion) */
  entryAnimClass: string;
  /** Ambient environment effect; consumers may disable independently */
  environmentEffect: EnvironmentEffect;
  /** ARIA accessible label — substitute {name} with the pet's name */
  ariaLabel: string;
  /** Static pose description for prefers-reduced-motion contexts */
  reducedMotionFallback: string;
  /** Preview background hex used in the gallery */
  previewBg: string;
  /** Tag badge background hex */
  tagBg: string;
  /** Tag badge text hex */
  tagText: string;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const PET_STATE_REGISTRY: Record<PetStateKind, PetStateMeta> = {
  healthy: {
    kind: 'healthy',
    label: 'Healthy',
    emotion: 'Balanced and content — a stable resting state with all needs met.',
    pairingGuidance:
      'Default resting display. Ambient habitat animations can run freely. No accent effects needed.',
    face: 'content',
    posture: 'upright',
    energy: 'medium',
    idleAnimClass: 'kino-anim-idle',
    entryAnimClass: 'kino-state-entry-settle',
    environmentEffect: 'none',
    ariaLabel: '{name} is healthy and content',
    reducedMotionFallback: 'Pet sits upright, round eyes open, gentle closed smile.',
    previewBg: '#EAF5FD',
    tagBg: '#C4E6F8',
    tagText: '#073B5C',
  },

  sick: {
    kind: 'sick',
    label: 'Sick',
    emotion: 'Unwell and dizzy — spiral eyes, wavy mouth, and drooping posture signal illness.',
    pairingGuidance:
      'Pair with a care-item affordance. Habitat animations may be dimmed to reinforce low energy.',
    face: 'sick',
    posture: 'droop',
    energy: 'critical',
    idleAnimClass: 'kino-em-sick',
    entryAnimClass: 'kino-state-entry-sag',
    environmentEffect: 'sick-cross',
    ariaLabel: '{name} is sick',
    reducedMotionFallback: 'Pet slumped, spiral dizzy eyes at half-mast, wavy mouth, X marks at cheeks.',
    previewBg: '#F0FAF0',
    tagBg: '#B4EAB4',
    tagText: '#1A4A1A',
  },

  recovering: {
    kind: 'recovering',
    label: 'Recovering',
    emotion: 'Slowly returning to baseline — content face but slouched, energy still low.',
    pairingGuidance:
      'Show after care has been applied. Subtle sparkle accent marks improvement without full resolution.',
    face: 'content',
    posture: 'slouch',
    energy: 'low',
    idleAnimClass: 'kino-state-idle-recover',
    entryAnimClass: 'kino-state-entry-rise',
    environmentEffect: 'sparkles',
    ariaLabel: '{name} is recovering',
    reducedMotionFallback: 'Pet slightly hunched, eyes softly open, faint geometric sparkle near head.',
    previewBg: '#F0FAF0',
    tagBg: '#D4EAB4',
    tagText: '#2A4A1A',
  },

  hungry: {
    kind: 'hungry',
    label: 'Hungry',
    emotion: 'Food-focused and impatient — wide open mouth, raised brows, drool accent.',
    pairingGuidance:
      'Pair with a food-item affordance. Drool geometry accent reinforces the need visually.',
    face: 'hungry',
    posture: 'perk',
    energy: 'medium',
    idleAnimClass: 'kino-em-hungry',
    entryAnimClass: 'kino-state-entry-bob',
    environmentEffect: 'drool',
    ariaLabel: '{name} is hungry',
    reducedMotionFallback: 'Pet leaning forward, wide open mouth, drool droplet visible, brows raised.',
    previewBg: '#FFF5E8',
    tagBg: '#FFD09A',
    tagText: '#5A2800',
  },

  nourished: {
    kind: 'nourished',
    label: 'Nourished',
    emotion: 'Satisfied after eating — happy face with crescent eyes, wide smile, sparkle accent.',
    pairingGuidance:
      'Brief positive state following feeding. Sparkle accent and bounce entry mark the transition visually.',
    face: 'happy',
    posture: 'upright',
    energy: 'high',
    idleAnimClass: 'kino-em-happy',
    entryAnimClass: 'kino-state-entry-bounce',
    environmentEffect: 'sparkles',
    ariaLabel: '{name} is nourished',
    reducedMotionFallback: 'Pet upright, crescent-arc eyes, wide open smile with tooth gap, geometric star near head.',
    previewBg: '#FFF8D6',
    tagBg: '#FFE347',
    tagText: '#5A3800',
  },

  messy: {
    kind: 'messy',
    label: 'Messy',
    emotion: 'Irritated by surrounding clutter — V-brows and frown signal discomfort.',
    pairingGuidance:
      'Overlay a mess-marker SVG in the habitat scene. Stink-line accents are separable and optional.',
    face: 'angry',
    posture: 'slouch',
    energy: 'low',
    idleAnimClass: 'kino-em-angry',
    entryAnimClass: 'kino-state-entry-shake',
    environmentEffect: 'stink',
    ariaLabel: '{name} is messy',
    reducedMotionFallback: 'Pet with sharp V-brows, tight frown, slightly slouched. Stink-line accents near body.',
    previewBg: '#FFF0EE',
    tagBg: '#FFBFB8',
    tagText: '#7A1200',
  },

  relieved: {
    kind: 'relieved',
    label: 'Relieved',
    emotion: 'Gratitude after clutter removed — loved face with heart pupils and blissful smile.',
    pairingGuidance:
      'Brief positive state following clean-up. Heart accent and float entry mark the transition.',
    face: 'loved',
    posture: 'upright',
    energy: 'medium',
    idleAnimClass: 'kino-em-loved',
    entryAnimClass: 'kino-state-entry-float',
    environmentEffect: 'hearts',
    ariaLabel: '{name} is relieved',
    reducedMotionFallback: 'Pet upright, heart-shaped pupils, blissful closed smile, geometric heart above head.',
    previewBg: '#FFF0F5',
    tagBg: '#FFAACE',
    tagText: '#5A0030',
  },

  tired: {
    kind: 'tired',
    label: 'Tired',
    emotion: 'Low energy — heavy half-lidded eyes, drooping posture, ZZZ accent.',
    pairingGuidance:
      'Slow habitat animations to match low energy. ZZZ geometric accent floats near the head.',
    face: 'sleepy',
    posture: 'droop',
    energy: 'low',
    idleAnimClass: 'kino-em-sleepy',
    entryAnimClass: 'kino-state-entry-sag',
    environmentEffect: 'zzz',
    ariaLabel: '{name} is tired',
    reducedMotionFallback: 'Pet drooping, heavy slit-eyes nearly closed, tiny yawn oval mouth, ZZZ text near head.',
    previewBg: '#F0EEFF',
    tagBg: '#C8B8F8',
    tagText: '#2A1F6A',
  },

  rested: {
    kind: 'rested',
    label: 'Rested',
    emotion: 'Energy restored — wide circular eyes with sparkles, perked posture, bounce entry.',
    pairingGuidance:
      'Brief post-rest positive state. Sparkle accent and bounce entry mark the wake-up visually.',
    face: 'excited',
    posture: 'perk',
    energy: 'high',
    idleAnimClass: 'kino-em-excited',
    entryAnimClass: 'kino-state-entry-bounce',
    environmentEffect: 'sparkles',
    ariaLabel: '{name} is rested',
    reducedMotionFallback: 'Pet perked forward, wide circular eyes, geometric sparkle stars at temples.',
    previewBg: '#FFF0FA',
    tagBg: '#FF86B8',
    tagText: '#5A0030',
  },

  bored: {
    kind: 'bored',
    label: 'Bored',
    emotion: 'Listless and disengaged — asymmetric half-lids, flat mouth, ellipsis dots.',
    pairingGuidance:
      'Habitat animations may slow. Ellipsis-dot accent floats near the face.',
    face: 'bored',
    posture: 'slouch',
    energy: 'low',
    idleAnimClass: 'kino-em-bored',
    entryAnimClass: 'kino-state-entry-sag',
    environmentEffect: 'none',
    ariaLabel: '{name} is bored',
    reducedMotionFallback: 'Pet slumped, asymmetric half-lidded eyes, near-flat mouth, ellipsis dots beside face.',
    previewBg: '#F4F4F4',
    tagBg: '#D4D4D4',
    tagText: '#444444',
  },

  engaged: {
    kind: 'engaged',
    label: 'Engaged',
    emotion: 'Absorbed in play — excited face, perked posture, rapid bounce animation.',
    pairingGuidance:
      'Active interaction state. Sparkle accent and fast idle animation show peak engagement.',
    face: 'excited',
    posture: 'perk',
    energy: 'high',
    idleAnimClass: 'kino-em-excited',
    entryAnimClass: 'kino-state-entry-bounce',
    environmentEffect: 'sparkles',
    ariaLabel: '{name} is engaged',
    reducedMotionFallback: 'Pet leaning forward, wide circular eyes, geometric sparkle stars.',
    previewBg: '#FFF0FA',
    tagBg: '#FF86B8',
    tagText: '#5A0030',
  },
};

// ---------------------------------------------------------------------------
// Runtime resolver — invalid strings fall back to "healthy" safely
// ---------------------------------------------------------------------------

const VALID_STATES = new Set<string>(Object.keys(PET_STATE_REGISTRY));

/**
 * Maps any runtime value to PetStateMeta. Unrecognised / null / undefined
 * values return the healthy metadata so callers never receive undefined.
 */
export function resolvePetState(raw: unknown): PetStateMeta {
  if (typeof raw === 'string' && VALID_STATES.has(raw)) {
    return PET_STATE_REGISTRY[raw as PetStateKind];
  }
  return PET_STATE_REGISTRY.healthy;
}

// ---------------------------------------------------------------------------
// Requested-to-canonical alias mapping
//
// All 11 requested state names map to themselves (identity).
// Additional common synonyms follow.
// ---------------------------------------------------------------------------

export const PET_STATE_ALIASES: Record<string, PetStateKind> = {
  // ── Identity: all 11 requested names ───────────────────────────────────
  healthy:    'healthy',
  sick:       'sick',
  recovering: 'recovering',
  hungry:     'hungry',
  nourished:  'nourished',
  messy:      'messy',
  relieved:   'relieved',
  tired:      'tired',
  rested:     'rested',
  bored:      'bored',
  engaged:    'engaged',

  // ── Optional synonyms (existing emotion/primitive reuse) ────────────────
  // These map common alternative spellings or emotion primitives to canonical names.
  content:  'healthy',   // emotion primitive → closest semantic state
  well:     'healthy',
  fine:     'healthy',
  ill:      'sick',
  unwell:   'sick',
  healing:  'recovering',
  mending:  'recovering',
  starving: 'hungry',
  peckish:  'hungry',
  fed:      'nourished',
  full:     'nourished',
  dirty:    'messy',
  gross:    'messy',
  sleepy:   'tired',     // emotion primitive → tired state
  exhausted: 'tired',
  awake:    'rested',
  refreshed: 'rested',
  excited:  'engaged',   // emotion primitive → engaged state
  playing:  'engaged',
  dull:     'bored',
};

export function resolveWithAliases(raw: unknown): PetStateMeta {
  if (typeof raw === 'string') {
    const canonical = PET_STATE_ALIASES[raw] ?? raw;
    return resolvePetState(canonical);
  }
  return PET_STATE_REGISTRY.healthy;
}

// ---------------------------------------------------------------------------
// Care chain pairings (visual relationships only; no transition logic)
// ---------------------------------------------------------------------------

export type CareChain = {
  need: PetStateKind;
  positive: PetStateKind;
  /** Always 'healthy' — the stable resolution state */
  resolution: PetStateKind;
  label: string;
};

/**
 * Five canonical visual care chains.
 * Each describes the relationship between a negative state, its immediate
 * positive response, and the resolved baseline. Consumers own all transitions.
 */
export const CARE_CHAIN_PAIRINGS: CareChain[] = [
  { need: 'hungry',   positive: 'nourished',  resolution: 'healthy', label: 'Hunger chain' },
  { need: 'sick',     positive: 'recovering', resolution: 'healthy', label: 'Illness chain' },
  { need: 'messy',    positive: 'relieved',   resolution: 'healthy', label: 'Mess chain' },
  { need: 'tired',    positive: 'rested',     resolution: 'healthy', label: 'Rest chain' },
  { need: 'bored',    positive: 'engaged',    resolution: 'healthy', label: 'Boredom chain' },
];

// ---------------------------------------------------------------------------
// Distinction pairs — exactly the ten requested pairs, once each
// ---------------------------------------------------------------------------

export type DistinctionPair = {
  a: PetStateKind;
  b: PetStateKind;
  distinction: string;
};

/**
 * Ten canonical pairs documenting visual and semantic distinctions.
 * Exactly the ten requested: sick/tired, sick/messy, hungry/bored,
 * hungry/tired, bored/tired, healthy/recovering, healthy/nourished,
 * healthy/relieved, healthy/rested, healthy/engaged.
 */
export const DISTINCTION_PAIRS: DistinctionPair[] = [
  {
    a: 'sick',
    b: 'tired',
    distinction:
      'Sick shows spiral dizzy eyes and X cheek marks — physical illness. Tired shows heavy half-lidded eyes with ZZZ — energy depletion. Different face geometry distinguishes them without color.',
  },
  {
    a: 'sick',
    b: 'messy',
    distinction:
      'Sick uses the sick face (spiral eyes, wavy mouth) and sick-cross accents. Messy uses the angry face (V-brows, tight frown) and stink-line accents. One signals physical illness; the other signals irritation.',
  },
  {
    a: 'hungry',
    b: 'bored',
    distinction:
      'Hungry has wide open mouth, raised brows, and drool accent — directed food craving. Bored has flat-line mouth and asymmetric half-lids — unfocused listlessness. Different mouth geometry is the primary signal.',
  },
  {
    a: 'hungry',
    b: 'tired',
    distinction:
      'Hungry is perked and anticipatory (open mouth, raised brows). Tired droops with heavy lids and ZZZ. Energy direction differs: hungry leans forward; tired leans down.',
  },
  {
    a: 'bored',
    b: 'tired',
    distinction:
      'Bored slouches with asymmetric eyes and ellipsis dots — energy present but aimless. Tired droops with uniformly heavy lids and ZZZ — energy absent. Posture and accent geometry differ.',
  },
  {
    a: 'healthy',
    b: 'recovering',
    distinction:
      'Healthy is fully upright with content face and no effects. Recovering has the same content face but slouched posture and a subtle sparkle accent, placing it visibly below baseline.',
  },
  {
    a: 'healthy',
    b: 'nourished',
    distinction:
      'Healthy uses the content face (round dot eyes, gentle smile) at medium energy. Nourished uses the happy face (crescent eyes, wide smile) at high energy with a sparkle accent — a brief peak above baseline.',
  },
  {
    a: 'healthy',
    b: 'relieved',
    distinction:
      'Healthy has the neutral content face with no effect. Relieved has the loved face (heart pupils, blissful smile) and heart geometric accents — a warm resolution state above baseline.',
  },
  {
    a: 'healthy',
    b: 'rested',
    distinction:
      'Healthy is the stable neutral state (content face, medium energy). Rested is a brief high-energy post-rest peak (excited face, sparkle accents, bounce entry). Both resolve to the same face if the excited animation stops.',
  },
  {
    a: 'healthy',
    b: 'engaged',
    distinction:
      'Healthy is passive and still (gentle idle bob, content face). Engaged is active and rapid (excited face, fast excited animation, sparkle accents) — ongoing high-energy interaction.',
  },
];

// ---------------------------------------------------------------------------
// Geometric SVG environment effect accents (no emoji)
// ---------------------------------------------------------------------------

/** Renders a small SVG geometric accent for the given effect. No emoji used. */
export function EffectAccent({
  effect,
  size = 20,
}: {
  effect: EnvironmentEffect;
  size?: number;
}): React.ReactElement | null {
  if (effect === 'none') return null;

  const s = size;
  const half = s / 2;

  if (effect === 'sparkles') {
    // Four-pointed star
    return (
      <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden="true" fill="none">
        <path d="M10 2 L11.5 8.5 L18 10 L11.5 11.5 L10 18 L8.5 11.5 L2 10 L8.5 8.5 Z" fill="#FFE347" stroke="#D4920A" strokeWidth="0.8" />
      </svg>
    );
  }
  if (effect === 'zzz') {
    // Z letter shapes stacked
    return (
      <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden="true">
        <text x="4" y="14" fontFamily="monospace" fontWeight="900" fontSize="11" fill="#5E4FD6" opacity="0.8">Z</text>
        <text x="10" y="9" fontFamily="monospace" fontWeight="900" fontSize="7" fill="#5E4FD6" opacity="0.55">Z</text>
      </svg>
    );
  }
  if (effect === 'drool') {
    // Teardrop / drip shape
    return (
      <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden="true" fill="none">
        <path d="M10 3 Q10 8 10 11 Q8 14 10 17 Q12 14 10 11 Q10 8 10 3Z" fill="#83DFF0" stroke="#0A58CA" strokeWidth="0.8" />
      </svg>
    );
  }
  if (effect === 'sick-cross') {
    // Plus / cross mark
    return (
      <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden="true" stroke="#73C95D" strokeWidth="3" strokeLinecap="round">
        <line x1="10" y1="4" x2="10" y2="16" />
        <line x1="4" y1="10" x2="16" y2="10" />
      </svg>
    );
  }
  if (effect === 'hearts') {
    // Simple heart path
    return (
      <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden="true" fill="none">
        <path d="M10 16 C10 12 4 9 4 6 C4 4 6 2 8 3 C9 3.5 10 5 10 5 C10 5 11 3.5 12 3 C14 2 16 4 16 6 C16 9 10 12 10 16Z" fill="#FF5D8F" stroke="#C03070" strokeWidth="0.6" />
      </svg>
    );
  }
  if (effect === 'stink') {
    // Wavy stink lines
    return (
      <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 14 C5 12 6 10 5 8" />
        <path d="M8 15 C9 12 10 10 9 7" />
        <path d="M12 14 C13 12 14 10 13 8" />
      </svg>
    );
  }
  // exhaustive check
  void (half); // keep half from being unused warning
  return null;
}

// React is needed for JSX
import React from 'react';

// ---------------------------------------------------------------------------
// PetStateDisplay — public component
// ---------------------------------------------------------------------------

export type PetStateDisplayProps = {
  /**
   * Canonical state name or alias. Invalid values fall back to "healthy".
   * All 11 canonical names pass through directly; aliases expand first.
   */
  state?: string;
  /** Which pet creature to render. Defaults to 'nubbin'. */
  kind?: PetKind;
  /** Pet name substituted into the accessible aria-label. */
  petName?: string;
  /** Sprite size. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * When true, renders environment effect accent beside the sprite.
   * When false (default), the effect is suppressed — separable from state.
   */
  showEffect?: boolean;
  /**
   * When true, suppresses all animation classes (treats as reduced-motion).
   * Use this to show an explicit static pose alongside the animated default.
   */
  forceReducedMotion?: boolean;
  /** Show the state label badge below the sprite. Defaults to true. */
  showLabel?: boolean;
  /** Additional className applied to the root wrapper. */
  className?: string;
};

/**
 * PetStateDisplay — canonical public pet component.
 *
 * Renders the Kinotchi pet sprite with the correct emotion face, idle
 * animation, and accessible label for the given semantic state.
 * Consumers pass a state name; this component resolves all visual details.
 *
 * @example
 * <PetStateDisplay state="hungry" kind="nubbin" petName="Pip" showEffect />
 * <PetStateDisplay state="bored" forceReducedMotion />
 */
export function PetStateDisplay({
  state = 'healthy',
  kind = 'nubbin',
  petName = 'Pet',
  size = 'md',
  showEffect = false,
  forceReducedMotion = false,
  showLabel = true,
  className = '',
}: PetStateDisplayProps) {
  const meta = resolveWithAliases(state);
  const ariaLabel = meta.ariaLabel.replace('{name}', petName);

  // Keep entry, posture, and idle transforms on separate wrappers so they compose.
  const entryClass = forceReducedMotion ? '' : meta.entryAnimClass;
  const bodyClass = forceReducedMotion ? '' : meta.idleAnimClass;
  const postureClass = `kino-state-posture-${meta.posture}`;

  return (
    <div
      className={`relative inline-flex flex-col items-center gap-2 ${className}`}
      data-state={meta.kind}
      data-reduced-motion={forceReducedMotion ? 'true' : undefined}
    >
      {/* Pet sprite with resolved emotion face */}
      <div
        className={entryClass}
        role="img"
        aria-label={ariaLabel}
        style={{ display: 'inline-block' }}
      >
        <div className={postureClass}>
          <div className={bodyClass}>
            <PetSprite
              kind={kind}
              size={size}
              label={ariaLabel}
              hideFace
              emotion={meta.face}
              emotionPlayState={forceReducedMotion ? 'paused' : 'running'}
            />
          </div>
        </div>
      </div>

      {/* Environment effect accent (separable) */}
      {showEffect && meta.environmentEffect !== 'none' && (
        <div aria-hidden="true" className="absolute -top-3 -right-3 pointer-events-none">
          <EffectAccent effect={meta.environmentEffect} size={22} />
        </div>
      )}

      {/* State label badge */}
      {showLabel && (
        <span
          className="rounded-full px-3 py-0.5 text-xs font-black"
          style={{ backgroundColor: meta.tagBg, color: meta.tagText }}
          aria-hidden="true"
        >
          {meta.label}
        </span>
      )}

      {/* Reduced-motion static pose description (screen-reader accessible) */}
      {forceReducedMotion && (
        <span className="sr-only">{meta.reducedMotionFallback}</span>
      )}
    </div>
  );
}
