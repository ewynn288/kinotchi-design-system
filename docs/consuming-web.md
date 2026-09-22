# Consuming Kinotchi Design System in web apps

Read `artifacts/kinotchi-design-system/docs/AGENTS.md` first. This guide covers
React/Vite and other shadcn/Tailwind web consumers. If the app already contains
a local theme or component library, also read
`artifacts/kinotchi-design-system/docs/migrating-web.md` before writing UI.

## Theme

Import this package's theme once from the app's main CSS:

```css
@import "@workspace/kinotchi-design-system/styles.css";
```

`styles.css` already imports Tailwind, its plugins, and this package's token
theme. It also registers this package's component sources. Do not add a separate
Tailwind import or a `node_modules` source path in a Tailwind v4 consumer.
Tailwind v3 consumers keep their existing `@tailwind` directives and add
`node_modules/@workspace/kinotchi-design-system/src/components` to `content`.

## Components and helpers

Import every provided primitive, `cn`, and toast API directly from this package:

```tsx
import { Button } from "@workspace/kinotchi-design-system/components/ui/button";
import { cn } from "@workspace/kinotchi-design-system/lib/utils";
import {
  toast,
  useToast,
} from "@workspace/kinotchi-design-system/hooks/use-toast";
```

Use the package component whenever it provides the required family. Keep
product-specific compositions in the app, but compose them from package
primitives rather than recreating those primitives locally.

The packaged `Toaster` and toast hook share one in-memory store. Do not call a
local toast hook while rendering the packaged `Toaster`.

## Verify

After wiring the workspace dependency, import and render
`@workspace/kinotchi-design-system/components/ui/button`. Run the app's typecheck
and dev server. The import must resolve and the Button must use this package's
theme before broader UI work begins.

## Semantic pet states

Import the state API from `pet-state`:

```tsx
import {
  resolvePetState,
  resolveWithAliases,
  PET_STATE_REGISTRY,
  PetStateKind,
  PetStateDisplay,
} from "@workspace/kinotchi-design-system/components/pet-state";

// Safe runtime resolver — invalid strings fall back to "healthy"
const meta = resolveWithAliases(currentState);

// Apply to PetSprite from kinotchi.tsx:
// <PetSprite emotion={meta.face} emotionAnimClass={meta.idleAnimClass} />

// Badge chrome:
// <PetStateDisplay state={currentState} petName="Nubbin" showEffect />
```

See `docs/pet-state-api.md` for the full specification including entry
animations, reduced-motion behaviour, care chains, and transition ownership.

## Ongoing rules

- Keep one source of theme variables.
- Import package-provided primitives and helpers from the package path.
- Add reusable product-agnostic components to this package first.
- For a non-shadcn app, use the tokens as the source of truth and adapt existing
  components to the token CSS variables without copying token values.
