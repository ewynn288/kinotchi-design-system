/**
 * Pet State Gallery — design-system browser page
 *
 * Uses PetStateDisplay as the primary consumer so the gallery itself is a
 * representative example of the public API. Every state shows:
 *  - Actual animated pet sprite (default motion)
 *  - Explicit forced-reduced-motion pet preview
 *  - State metadata (face, energy, idle/entry class)
 *  - Background-color compatibility strip
 *
 * No emoji glyphs — all accents are geometric SVG or text.
 */
import { useState } from 'react';
import {
  PET_STATE_REGISTRY,
  CARE_CHAIN_PAIRINGS,
  DISTINCTION_PAIRS,
  PET_STATE_ALIASES,
  PetStateDisplay,
  EffectAccent,
  type PetStateKind,
  type PetStateMeta,
  type EnvironmentEffect,
} from '../../components/pet-state';
import { Guidelines } from '../parts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_STATES = Object.values(PET_STATE_REGISTRY);

/** Enclosure-friendly background colours from the habitat palette */
const SAMPLE_BG_COLORS: { label: string; hex: string }[] = [
  { label: 'Bay sky',    hex: '#D0E8F4' },
  { label: 'Sand',      hex: '#F0D880' },
  { label: 'Grove',     hex: '#D7F3B9' },
  { label: 'Night sky', hex: '#0D1A40' },
  { label: 'Pale pink', hex: '#FFF0FA' },
];

const ENERGY_COLORS: Record<string, { bg: string; text: string }> = {
  high:     { bg: '#FFE347', text: '#5A3800' },
  medium:   { bg: '#C4E6F8', text: '#073B5C' },
  low:      { bg: '#D4D4D4', text: '#444444' },
  critical: { bg: '#FFBFB8', text: '#7A1200' },
};

// ---------------------------------------------------------------------------
// Pet preview cell — renders the actual PetStateDisplay component
// ---------------------------------------------------------------------------

function StatePetPreview({
  meta,
  reducedMotion = false,
  bgHex,
}: {
  meta: PetStateMeta;
  reducedMotion?: boolean;
  bgHex?: string;
}) {
  return (
    <div
      className="relative flex flex-col items-center justify-end gap-2 rounded-2xl border-2 border-[#074F9A]/15 py-4 px-3"
      style={{ backgroundColor: bgHex ?? meta.previewBg, minHeight: 140 }}
    >
      {/* Actual pet via public API */}
      <PetStateDisplay
        state={meta.kind}
        kind="nubbin"
        size="md"
        showEffect={false}
        showLabel={false}
        forceReducedMotion={reducedMotion}
      />

      {/* Effect accent (separable from sprite) */}
      {meta.environmentEffect !== 'none' && (
        <div
          className="absolute top-3 right-3"
          aria-hidden="true"
          title={`Effect: ${meta.environmentEffect}`}
        >
          <EffectAccent effect={meta.environmentEffect as EnvironmentEffect} size={22} />
        </div>
      )}

      {/* Motion mode label */}
      <span className="text-[9px] font-black uppercase tracking-wide opacity-50">
        {reducedMotion ? 'reduced-motion' : 'default'}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// State Card — compact catalog view
// ---------------------------------------------------------------------------

function StateCard({ meta, selected }: { meta: PetStateMeta; selected: boolean }) {
  const energyStyle = ENERGY_COLORS[meta.energy];
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border-2 p-4 transition-all ${
        selected ? 'border-[#074F9A] ring-4 ring-[#074F9A] ring-offset-2' : 'border-[#074F9A]/15'
      }`}
      style={{ backgroundColor: meta.previewBg }}
    >
      {/* Actual pet preview */}
      <div className="flex justify-center">
        <PetStateDisplay
          state={meta.kind}
          kind="nubbin"
          size="sm"
          showEffect={false}
          showLabel={false}
        />
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="font-black text-sm text-[#073B5C]">{meta.label}</span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-black"
          style={{ backgroundColor: meta.tagBg, color: meta.tagText }}
        >
          {meta.kind}
        </span>
      </div>

      {/* Face + energy chips */}
      <div className="flex flex-wrap gap-1">
        <span className="rounded-full bg-white/70 border border-[#074F9A]/20 px-2 py-0.5 text-[10px] font-bold text-[#073B5C]">
          face: {meta.face}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: energyStyle.bg, color: energyStyle.text }}
        >
          {meta.energy}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel for selected state
// ---------------------------------------------------------------------------

function StateDetailPanel({ meta }: { meta: PetStateMeta }) {
  const energyStyle = ENERGY_COLORS[meta.energy];
  return (
    <div className="rounded-2xl border-2 bg-card p-6 text-card-foreground space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-black">{meta.label}</h3>
        <span
          className="rounded-full px-3 py-1 text-xs font-black"
          style={{ backgroundColor: meta.tagBg, color: meta.tagText }}
        >
          {meta.kind}
        </span>
        <span
          className="rounded-full px-3 py-1 text-xs font-black"
          style={{ backgroundColor: energyStyle.bg, color: energyStyle.text }}
        >
          {meta.energy} energy
        </span>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">{meta.emotion}</p>

      {/* Default vs reduced-motion pet previews */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-wide text-primary mb-3">
          Pet previews — default and reduced-motion
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Default motion */}
          <div className="flex flex-col items-center gap-1">
            <StatePetPreview meta={meta} reducedMotion={false} />
          </div>
          {/* Forced reduced-motion */}
          <div className="flex flex-col items-center gap-1">
            <StatePetPreview meta={meta} reducedMotion={true} />
          </div>
          {/* With effect accent */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="relative flex flex-col items-center justify-end gap-2 rounded-2xl border-2 border-[#074F9A]/15 py-4 px-3"
              style={{ backgroundColor: meta.previewBg, minHeight: 140 }}
            >
              <PetStateDisplay
                state={meta.kind}
                kind="nubbin"
                size="md"
                showLabel={false}
              />
              <div className="absolute top-3 right-3" aria-hidden="true">
                <EffectAccent effect={meta.environmentEffect as EnvironmentEffect} size={22} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wide opacity-50">with effect</span>
            </div>
          </div>
          {/* Effect suppressed */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex flex-col items-center justify-end gap-2 rounded-2xl border-2 border-[#074F9A]/15 py-4 px-3"
              style={{ backgroundColor: meta.previewBg, minHeight: 140 }}
            >
              <PetStateDisplay
                state={meta.kind}
                kind="nubbin"
                size="md"
                showEffect={false}
                showLabel={false}
              />
              <span className="text-[9px] font-black uppercase tracking-wide opacity-50">no effect</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background color previews */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-wide text-primary mb-3">On enclosure backgrounds</p>
        <div className="flex flex-wrap gap-3">
          {SAMPLE_BG_COLORS.map((bg) => (
            <div key={bg.hex} className="flex flex-col items-center gap-1">
              <StatePetPreview meta={meta} bgHex={bg.hex} />
              <span className="text-[9px] text-muted-foreground">{bg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reduced-motion fallback text */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-primary mb-1">Reduced-motion static pose</p>
        <p className="text-sm text-muted-foreground">{meta.reducedMotionFallback}</p>
      </div>

      {/* Pairing guidance */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-primary mb-1">Visual pairing guidance</p>
        <p className="text-sm text-muted-foreground">{meta.pairingGuidance}</p>
      </div>

      {/* Technical grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          { label: 'Face', value: meta.face },
          { label: 'Posture', value: meta.posture },
          { label: 'Idle class', value: meta.idleAnimClass },
          { label: 'Entry class', value: meta.entryAnimClass },
          { label: 'Effect', value: meta.environmentEffect },
        ].map((row) => (
          <div key={row.label} className="rounded-lg border border-border bg-background px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground mb-0.5">{row.label}</p>
            <code className="text-xs font-mono text-foreground break-all">{row.value}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Care chain pairings
// ---------------------------------------------------------------------------

function CareChainPairings() {
  return (
    <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
      <h2 className="font-black text-xl mb-1">Need → Positive → Healthy care chains</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Five canonical visual sequences. Consumers own all transition logic.
      </p>
      <div className="space-y-3">
        {CARE_CHAIN_PAIRINGS.map((chain) => {
          const needMeta = PET_STATE_REGISTRY[chain.need];
          const posMeta = PET_STATE_REGISTRY[chain.positive];
          const resMeta = PET_STATE_REGISTRY[chain.resolution];
          return (
            <div key={chain.label} className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-black text-primary mb-3">{chain.label}</p>
              <div className="flex flex-wrap items-center gap-3">
                {/* Need state */}
                <div className="flex flex-col items-center gap-1">
                  <PetStateDisplay state={chain.need} kind="nubbin" size="sm" showLabel={false} />
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: needMeta.tagBg, color: needMeta.tagText }}>{needMeta.label}</span>
                </div>
                <span className="text-muted-foreground font-mono text-lg">→</span>
                {/* Positive state */}
                <div className="flex flex-col items-center gap-1">
                  <PetStateDisplay state={chain.positive} kind="nubbin" size="sm" showLabel={false} />
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: posMeta.tagBg, color: posMeta.tagText }}>{posMeta.label}</span>
                </div>
                <span className="text-muted-foreground font-mono text-lg">→</span>
                {/* Resolution */}
                <div className="flex flex-col items-center gap-1">
                  <PetStateDisplay state={chain.resolution} kind="nubbin" size="sm" showLabel={false} />
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: resMeta.tagBg, color: resMeta.tagText }}>{resMeta.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Alias mapping table
// ---------------------------------------------------------------------------

function AliasTable() {
  // Split into identity (11 canonical names) and synonyms
  const CANONICAL_NAMES = new Set(Object.keys(PET_STATE_REGISTRY));
  const identityEntries = Object.entries(PET_STATE_ALIASES).filter(([k]) => CANONICAL_NAMES.has(k));
  const synonymEntries = Object.entries(PET_STATE_ALIASES).filter(([k]) => !CANONICAL_NAMES.has(k));

  return (
    <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
      <h2 className="font-black text-xl mb-1">Requested-to-canonical mapping</h2>
      <p className="text-sm text-muted-foreground mb-4">
        All 11 requested state names map to themselves (identity). Additional synonyms expand common alternatives.
        Pass any to <code className="text-xs font-mono">resolveWithAliases()</code> — invalid strings fall back to <strong>healthy</strong>.
      </p>

      <h3 className="text-sm font-black mb-2 text-primary">Identity (11 canonical names)</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 mb-5">
        {identityEntries.map(([alias, canonical]) => {
          const meta = PET_STATE_REGISTRY[canonical];
          return (
            <div key={alias} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
              <code className="text-xs font-mono text-foreground">{alias}</code>
              <span className="text-muted-foreground text-xs">→</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: meta.tagBg, color: meta.tagText }}>{canonical}</span>
            </div>
          );
        })}
      </div>

      <h3 className="text-sm font-black mb-2 text-primary">Synonyms (emotion primitives + alternatives)</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {synonymEntries.map(([alias, canonical]) => {
          const meta = PET_STATE_REGISTRY[canonical];
          return (
            <div key={alias} className="flex items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2">
              <code className="text-xs font-mono text-muted-foreground">{alias}</code>
              <span className="text-muted-foreground text-xs">→</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: meta.tagBg, color: meta.tagText }}>{canonical}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Distinction pairs matrix (exactly 10 requested pairs)
// ---------------------------------------------------------------------------

function DistinctionMatrix() {
  return (
    <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
      <h2 className="font-black text-xl mb-1">Ten distinction pairs</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Exactly the ten requested pairs — sick/tired, sick/messy, hungry/bored, hungry/tired, bored/tired,
        healthy/recovering, healthy/nourished, healthy/relieved, healthy/rested, healthy/engaged.
      </p>
      <div className="space-y-3">
        {DISTINCTION_PAIRS.map((pair, i) => {
          const a = PET_STATE_REGISTRY[pair.a];
          const b = PET_STATE_REGISTRY[pair.b];
          return (
            <div key={i} className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="flex flex-col items-center gap-1">
                  <PetStateDisplay state={pair.a} kind="nubbin" size="sm" showLabel={false} />
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: a.tagBg, color: a.tagText }}>{a.label}</span>
                </div>
                <span className="text-sm font-black text-muted-foreground">vs</span>
                <div className="flex flex-col items-center gap-1">
                  <PetStateDisplay state={pair.b} kind="nubbin" size="sm" showLabel={false} />
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: b.tagBg, color: b.tagText }}>{b.label}</span>
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{pair.distinction}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// API Reference
// ---------------------------------------------------------------------------

function ApiReference() {
  return (
    <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
      <h2 className="font-black text-xl mb-4">Public API reference</h2>
      <div className="space-y-3">
        {[
          {
            name: 'PetStateDisplay',
            kind: 'component',
            desc: 'Renders the Kinotchi pet sprite with the resolved face, animation, and accessible label. Props: state, kind, petName, size, showEffect, forceReducedMotion, showLabel.',
            code: `<PetStateDisplay state="hungry" kind="nubbin" petName="Pip" showEffect />`,
          },
          {
            name: 'PetStateKind',
            kind: 'type',
            desc: 'Union of all 11 canonical state names.',
            code: `type PetStateKind = "healthy" | "sick" | "recovering" | …`,
          },
          {
            name: 'PetStateMeta',
            kind: 'type',
            desc: 'Full metadata shape: face, posture, energy, animations, labels, pairing guidance.',
            code: `const meta: PetStateMeta = PET_STATE_REGISTRY["healthy"];`,
          },
          {
            name: 'PET_STATE_REGISTRY',
            kind: 'const',
            desc: 'Record<PetStateKind, PetStateMeta> — import for tests and static analysis.',
            code: `PET_STATE_REGISTRY["sick"].face // → "sick"`,
          },
          {
            name: 'resolvePetState(raw)',
            kind: 'fn',
            desc: 'Maps any unknown runtime value to PetStateMeta. Fallback: healthy.',
            code: `const m = resolvePetState(savedState); // never undefined`,
          },
          {
            name: 'resolveWithAliases(raw)',
            kind: 'fn',
            desc: 'Expands PET_STATE_ALIASES first, then resolves safely.',
            code: `resolveWithAliases("sleepy"); // → tired PetStateMeta`,
          },
          {
            name: 'PET_STATE_ALIASES',
            kind: 'const',
            desc: 'Identity map for all 11 canonical names + optional synonyms.',
            code: `PET_STATE_ALIASES["tired"] === "tired" // identity`,
          },
          {
            name: 'EffectAccent',
            kind: 'component',
            desc: 'SVG geometric accent for an EnvironmentEffect value. No emoji. Separable from PetStateDisplay.',
            code: `<EffectAccent effect="sparkles" size={20} />`,
          },
          {
            name: 'PetSprite, PetKind, EmotionKind',
            kind: 're-export',
            desc: 'Canonical types and sprite component re-exported from kinotchi.tsx. No duplication.',
            code: `import { PetSprite, PetKind, EmotionKind } from "./components/pet-state";`,
          },
        ].map((entry) => (
          <div key={entry.name} className="grid gap-1 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-[180px_1fr]">
            <div>
              <span className="font-black text-sm text-primary">{entry.name}</span>
              <span className="ml-2 text-[10px] text-muted-foreground uppercase">{entry.kind}</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{entry.desc}</p>
              <code className="block text-xs font-mono bg-background/80 rounded px-2 py-1 text-foreground">{entry.code}</code>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Invalid fallback demo
// ---------------------------------------------------------------------------

function InvalidFallbackDemo() {
  return (
    <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
      <h2 className="font-black text-xl mb-3">Invalid value fallback</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Any unknown string, null, or non-string value resolves safely to <strong>healthy</strong>.
      </p>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <PetStateDisplay state="totally-made-up-state" kind="nubbin" />
          <code className="text-xs font-mono text-muted-foreground">"totally-made-up-state"</code>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PetStateDisplay state={undefined} kind="nubbin" />
          <code className="text-xs font-mono text-muted-foreground">undefined</code>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PetStateDisplay state="" kind="nubbin" />
          <code className="text-xs font-mono text-muted-foreground">""</code>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Reduced-motion section
// ---------------------------------------------------------------------------

function ReducedMotionSection() {
  return (
    <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
      <h2 className="font-black text-xl mb-1">Reduced-motion behaviour</h2>
      <p className="text-sm text-muted-foreground mb-5">
        All <code className="text-xs font-mono">kino-state-*</code> and <code className="text-xs font-mono">kino-em-*</code> classes are listed in the{' '}
        <code className="text-xs font-mono">@media (prefers-reduced-motion: reduce)</code> block.
        Use <code className="text-xs font-mono">forceReducedMotion</code> to show the static pose explicitly.
        Each state's <code className="text-xs font-mono">reducedMotionFallback</code> describes the legible static form.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_STATES.map((meta) => (
          <div key={meta.kind} className="rounded-xl border border-border p-3" style={{ backgroundColor: meta.previewBg }}>
            <div className="flex items-start gap-3">
              <PetStateDisplay
                state={meta.kind}
                kind="nubbin"
                size="sm"
                showLabel={false}
                forceReducedMotion
              />
              <div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: meta.tagBg, color: meta.tagText }}>{meta.label}</span>
                <p className="text-xs text-muted-foreground mt-1 leading-5">{meta.reducedMotionFallback}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main page export
// ---------------------------------------------------------------------------

export function PetStateGalleryPage() {
  const [selected, setSelected] = useState<PetStateKind>('healthy');
  const selectedMeta = PET_STATE_REGISTRY[selected];

  return (
    <div className="space-y-8">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-[2rem] border-4 border-[#074F9A] bg-gradient-to-br from-[#FFF0FA] via-[#EAF5FD] to-[#FFF8D6] p-6 text-[#073B5C]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #074F9A 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#074F9A]">Semantic Pet States</p>
          <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Pet-state API</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#073B5C]/80">
            A typed, product-agnostic semantic layer mapping care states to pet face treatments,
            body motion, environment effects, accessible labels, and visual pairing guidance.
            Composes existing emotion vocabulary and CSS motion primitives without duplicating them.
            Consumers own all state transitions.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#074F9A] px-3 py-1 text-xs font-black text-white">11 states</span>
            <span className="rounded-full bg-[#FFE347] px-3 py-1 text-xs font-black text-[#5A3800]">Type-safe resolver</span>
            <span className="rounded-full bg-[#FF86B8] px-3 py-1 text-xs font-black text-[#5A0030]">Reduced-motion safe</span>
            <span className="rounded-full bg-[#B4EAB4] px-3 py-1 text-xs font-black text-[#1A4A1A]">Alias-aware</span>
          </div>
        </div>
      </section>

      {/* ── Full catalog grid ── */}
      <section>
        <h2 className="font-black text-xl mb-4">All 11 canonical states — click for detail</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ALL_STATES.map((meta) => (
            <button
              key={meta.kind}
              type="button"
              onClick={() => setSelected(meta.kind)}
              className="text-left transition-all rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#074F9A]"
            >
              <StateCard meta={meta} selected={selected === meta.kind} />
            </button>
          ))}
        </div>
      </section>

      {/* ── Detail view of selected state ── */}
      <section>
        <h2 className="font-black text-xl mb-4">State detail: {selectedMeta.label}</h2>
        <StateDetailPanel meta={selectedMeta} />
      </section>

      {/* ── Invalid fallback demo ── */}
      <InvalidFallbackDemo />

      {/* ── Reduced-motion ── */}
      <ReducedMotionSection />

      {/* ── Care chain pairings ── */}
      <CareChainPairings />

      {/* ── Alias mapping ── */}
      <AliasTable />

      {/* ── Distinction matrix ── */}
      <DistinctionMatrix />

      {/* ── API Reference ── */}
      <ApiReference />

      {/* ── Design guidelines ── */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <h2 className="font-black text-xl mb-4">Composition rules</h2>
        <Guidelines items={[
          { kind: 'do', text: 'Use PetStateDisplay as the primary pet component — it resolves all visual details from the state name.' },
          { kind: 'do', text: 'Use resolvePetState() or resolveWithAliases() when reading metadata without rendering a component.' },
          { kind: 'do', text: 'Set showEffect={false} when the enclosure already renders a separate habitat-level clutter marker.' },
          { kind: 'do', text: 'Pass forceReducedMotion={true} to render the explicit static pose, e.g. for side-by-side motion comparisons.' },
          { kind: 'do', text: 'Import PetSprite, PetKind, EmotionKind from pet-state.tsx — they are re-exported from kinotchi.tsx without duplication.' },
          { kind: 'dont', text: 'Do not read PET_STATE_REGISTRY with an unvalidated string. Always pass through resolvePetState() first.' },
          { kind: 'dont', text: 'Do not own state transitions in this module. Consumers drive all state changes based on their own logic.' },
          { kind: 'dont', text: 'Do not introduce new states outside this registry without updating docs, tests, and the gallery.' },
        ]} />
      </section>

    </div>
  );
}
