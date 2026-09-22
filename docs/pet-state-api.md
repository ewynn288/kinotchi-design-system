# Kinotchi Semantic Pet-State API

## Overview

`src/components/pet-state.tsx` provides a typed, product-agnostic semantic state layer that maps Kinotchi care states to face treatments, body motion, environment effects, accessible labels, and visual pairing guidance. It imports `PetSprite`, `PetKind`, and `EmotionKind` from the canonical `kinotchi.tsx` source and re-exports them — there is no duplication.

Exported as: `@workspace/kinotchi-design-system/components/pet-state`

**Consumers own all state transitions.** This module owns only visual semantics.

## Canonical states

| State | Face | Energy | Posture |
|---|---|---|---|
| `healthy` | `content` | medium | upright |
| `sick` | `sick` | critical | droop |
| `recovering` | `content` | low | slouch |
| `hungry` | `hungry` | medium | perk |
| `nourished` | `happy` | high | upright |
| `messy` | `angry` | low | slouch |
| `relieved` | `loved` | medium | upright |
| `tired` | `sleepy` | low | droop |
| `rested` | `excited` | high | perk |
| `bored` | `bored` | low | slouch |
| `engaged` | `excited` | high | perk |

## Imports

```tsx
import {
  // Types
  PetStateKind,
  PetStateMeta,

  // Re-exported from kinotchi.tsx (no duplication)
  PetKind,
  EmotionKind,
  PetSprite,

  // Data
  PET_STATE_REGISTRY,
  PET_STATE_ALIASES,
  CARE_CHAIN_PAIRINGS,
  DISTINCTION_PAIRS,

  // Resolvers
  resolvePetState,
  resolveWithAliases,

  // Components
  PetStateDisplay,
  EffectAccent,
} from "@workspace/kinotchi-design-system/components/pet-state";
```

## Primary component: PetStateDisplay

Renders the Kinotchi pet sprite with the correct emotion face, idle animation, accessible label, and optional state badge. Consumers select a semantic state; the component resolves all visual details.

```tsx
// Default — renders nubbin pet in healthy state
<PetStateDisplay />

// Specific state with petName in accessible label
<PetStateDisplay state="hungry" kind="nubbin" petName="Pip" />

// With separable environment effect accent
<PetStateDisplay state="tired" showEffect />

// Explicit reduced-motion pose (static, no animation)
<PetStateDisplay state="sick" forceReducedMotion />

// Suppress label badge
<PetStateDisplay state="bored" showLabel={false} />
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `state` | `string` | `"healthy"` | Canonical name or alias; invalid → healthy |
| `kind` | `PetKind` | `"nubbin"` | Which creature to render |
| `petName` | `string` | `"Pet"` | Substituted into the aria-label |
| `size` | `"sm"\|"md"\|"lg"` | `"md"` | Sprite size |
| `showEffect` | `boolean` | `false` | Show separable environment effect accent |
| `forceReducedMotion` | `boolean` | `false` | Suppress animations, show static pose |
| `showLabel` | `boolean` | `true` | Show the state label badge |
| `className` | `string` | `""` | Additional root className |

## Resolvers

### `resolvePetState(raw: unknown): PetStateMeta`

Maps any runtime value to `PetStateMeta`. Never throws, never returns undefined.

```tsx
const meta = resolvePetState(savedState);
// meta.face        → EmotionKind
// meta.idleAnimClass → CSS class string
// meta.ariaLabel  → '{name} is hungry'
```

### `resolveWithAliases(raw: unknown): PetStateMeta`

Expands `PET_STATE_ALIASES` first (all 11 canonical names are identity), then resolves.

## Alias mapping

All 11 requested canonical names map to themselves. Additional synonyms expand alternative spellings and emotion primitive names:

```tsx
resolveWithAliases("tired")   // → tired (identity)
resolveWithAliases("sleepy")  // → tired (synonym: emotion primitive)
resolveWithAliases("excited") // → engaged (synonym: emotion primitive)
resolveWithAliases("garbage") // → healthy (fallback)
```

## Care chains (visual relationships)

Five state tuples — consumers own all transition logic:

```
hungry   → nourished  → healthy
sick     → recovering → healthy
messy    → relieved   → healthy
tired    → rested     → healthy
bored    → engaged    → healthy
```

## Environment effects (separable)

Effects are independent of the state render. Use `showEffect={false}` when the enclosure already renders a habitat-level clutter marker:

```tsx
<PetStateDisplay state="messy" showEffect />       // stink-line SVG accent shown
<PetStateDisplay state="messy" showEffect={false} /> // stink accent suppressed, state unchanged
```

## Reduced-motion

All `kino-state-*` and `kino-em-*` classes have `animation: none !important` in the `@media (prefers-reduced-motion: reduce)` block in `src/index.css`. Use `forceReducedMotion` to show the static pose explicitly alongside the animated default.

Each state's `reducedMotionFallback` string describes the legible static form for screen readers and explicit reduced-motion contexts.

## Wiring with PetSprite directly

For consumers who need to drive the sprite themselves:

```tsx
import { PetSprite, PetStateDisplay } from "…/components/pet-state";
import { PET_STATE_REGISTRY } from "…/components/pet-state";

const meta = PET_STATE_REGISTRY["sick"];

<div className={meta.idleAnimClass}>
  <PetSprite
    kind="nubbin"
    hideFace
    emotion={meta.face}
    label={meta.ariaLabel.replace("{name}", "Pip")}
  />
</div>
```
