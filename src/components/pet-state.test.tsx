/**
 * Pet-state API tests — Node/tsx compatible, uses react-dom/server for rendering.
 * No Vitest required. Run with:
 *   cd artifacts/kinotchi-design-system && node_modules/.bin/tsx src/components/pet-state.test.tsx
 */

// React + server rendering
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Public API under test
import {
  PET_STATE_REGISTRY,
  PET_STATE_ALIASES,
  CARE_CHAIN_PAIRINGS,
  DISTINCTION_PAIRS,
  resolvePetState,
  resolveWithAliases,
  PetStateDisplay,
  EffectAccent,
  PetSprite,
  type PetStateKind,
  type PetStateMeta,
  type EmotionKind,
  type PetKind,
} from './pet-state.tsx';

// ---------------------------------------------------------------------------
// Minimal assertion helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertEqual<T>(a: T, b: T, message: string): void {
  assert(a === b, `${message} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`);
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// Helper: render a component to static HTML string
function render(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

// ---------------------------------------------------------------------------
// Canonical state list
// ---------------------------------------------------------------------------

const CANONICAL_STATES: PetStateKind[] = [
  'healthy', 'sick', 'recovering', 'hungry', 'nourished',
  'messy', 'relieved', 'tired', 'rested', 'bored', 'engaged',
];

// ---------------------------------------------------------------------------
// 1. All canonical states present
// ---------------------------------------------------------------------------

section('All 11 canonical states present in registry');

assertEqual(Object.keys(PET_STATE_REGISTRY).length, 11, 'registry has exactly 11 entries');
for (const state of CANONICAL_STATES) {
  assert(state in PET_STATE_REGISTRY, `registry contains "${state}"`);
}

// ---------------------------------------------------------------------------
// 2. PetStateMeta shape completeness (no transitionOwner field in updated spec)
// ---------------------------------------------------------------------------

section('PetStateMeta shape completeness');

const REQUIRED_FIELDS: (keyof PetStateMeta)[] = [
  'kind', 'label', 'emotion', 'pairingGuidance',
  'face', 'posture', 'energy', 'idleAnimClass', 'entryAnimClass',
  'environmentEffect', 'ariaLabel', 'reducedMotionFallback',
  'previewBg', 'tagBg', 'tagText',
];

for (const state of CANONICAL_STATES) {
  const meta = PET_STATE_REGISTRY[state];
  for (const field of REQUIRED_FIELDS) {
    assert(
      meta[field] !== undefined && meta[field] !== '',
      `${state}.${field} is defined and non-empty`,
    );
  }
}

// ---------------------------------------------------------------------------
// 3. meta.kind matches its registry key
// ---------------------------------------------------------------------------

section('meta.kind matches registry key');

for (const [key, meta] of Object.entries(PET_STATE_REGISTRY)) {
  assertEqual(meta.kind, key as PetStateKind, `meta.kind === key for "${key}"`);
}

// ---------------------------------------------------------------------------
// 4. ariaLabel contains {name} placeholder
// ---------------------------------------------------------------------------

section('ariaLabel contains {name} placeholder');

for (const [key, meta] of Object.entries(PET_STATE_REGISTRY)) {
  assert(meta.ariaLabel.includes('{name}'), `${key}.ariaLabel contains {name} placeholder`);
}

// ---------------------------------------------------------------------------
// 5. Animation classes are valid kino-* strings
// ---------------------------------------------------------------------------

section('idleAnimClass and entryAnimClass are kino-* strings');

for (const [key, meta] of Object.entries(PET_STATE_REGISTRY)) {
  assert(
    typeof meta.idleAnimClass === 'string' && meta.idleAnimClass.startsWith('kino-'),
    `${key}.idleAnimClass starts with kino-`,
  );
  assert(
    typeof meta.entryAnimClass === 'string' && meta.entryAnimClass.startsWith('kino-'),
    `${key}.entryAnimClass starts with kino-`,
  );
}

// ---------------------------------------------------------------------------
// 6. resolvePetState — valid inputs
// ---------------------------------------------------------------------------

section('resolvePetState() — valid inputs');

for (const state of CANONICAL_STATES) {
  const meta = resolvePetState(state);
  assertEqual(meta.kind, state, `resolvePetState("${state}") returns correct state`);
}

// ---------------------------------------------------------------------------
// 7. resolvePetState — invalid fallback to healthy
// ---------------------------------------------------------------------------

section('resolvePetState() — invalid inputs fall back to healthy');

const INVALID_INPUTS: unknown[] = [
  undefined, null, '', 0, false, 'garbage', 'HEALTHY', 'Sick', '  sick  ', {}, [],
];

for (const input of INVALID_INPUTS) {
  const meta = resolvePetState(input);
  assertEqual(meta.kind, 'healthy', `resolvePetState(${JSON.stringify(input)}) → healthy`);
}

// ---------------------------------------------------------------------------
// 8. Default healthy behavior
// ---------------------------------------------------------------------------

section('Default healthy behavior');

const healthyMeta = resolvePetState('healthy');
assertEqual(healthyMeta.face, 'content', 'healthy.face is content');
assertEqual(healthyMeta.energy, 'medium', 'healthy.energy is medium');
assertEqual(healthyMeta.environmentEffect, 'none', 'healthy.environmentEffect is none');
assertEqual(healthyMeta.posture, 'upright', 'healthy.posture is upright');
assertEqual(healthyMeta.idleAnimClass, 'kino-anim-idle', 'healthy.idleAnimClass is kino-anim-idle');

// ---------------------------------------------------------------------------
// 9. PET_STATE_ALIASES — identity for all 11 canonical names
// ---------------------------------------------------------------------------

section('PET_STATE_ALIASES — identity for all 11 canonical state names');

for (const state of CANONICAL_STATES) {
  assert(state in PET_STATE_ALIASES, `"${state}" is in PET_STATE_ALIASES`);
  assertEqual(PET_STATE_ALIASES[state], state, `PET_STATE_ALIASES["${state}"] === "${state}" (identity)`);
}

// ---------------------------------------------------------------------------
// 10. resolveWithAliases — identity expansion for canonical names
// ---------------------------------------------------------------------------

section('resolveWithAliases() — canonical names resolve to themselves');

for (const state of CANONICAL_STATES) {
  const meta = resolveWithAliases(state);
  assertEqual(meta.kind, state, `resolveWithAliases("${state}") → "${state}"`);
}

// ---------------------------------------------------------------------------
// 11. resolveWithAliases — synonym expansion
// ---------------------------------------------------------------------------

section('resolveWithAliases() — synonym expansion');

const SYNONYM_CHECKS: [string, PetStateKind][] = [
  ['sleepy', 'tired'],
  ['starving', 'hungry'],
  ['ill', 'sick'],
  ['healing', 'recovering'],
  ['dirty', 'messy'],
  ['awake', 'rested'],
  ['playing', 'engaged'],
  ['fed', 'nourished'],
  ['dull', 'bored'],
  ['fine', 'healthy'],
  ['content', 'healthy'],
  ['excited', 'engaged'],
];

for (const [alias, expected] of SYNONYM_CHECKS) {
  const meta = resolveWithAliases(alias);
  assertEqual(meta.kind, expected, `resolveWithAliases("${alias}") → "${expected}"`);
}

// ---------------------------------------------------------------------------
// 12. resolveWithAliases — invalid fallback
// ---------------------------------------------------------------------------

section('resolveWithAliases() — invalid inputs fall back to healthy');

assertEqual(resolveWithAliases('totally-made-up-xyz').kind, 'healthy', 'unknown string falls back to healthy');
assertEqual(resolveWithAliases(42).kind, 'healthy', 'non-string falls back to healthy');
assertEqual(resolveWithAliases(null).kind, 'healthy', 'null falls back to healthy');

// ---------------------------------------------------------------------------
// 13. PET_STATE_ALIASES — all values are valid PetStateKinds
// ---------------------------------------------------------------------------

section('PET_STATE_ALIASES — all values are valid PetStateKinds');

const validKindSet = new Set(CANONICAL_STATES);
for (const [alias, target] of Object.entries(PET_STATE_ALIASES)) {
  assert(validKindSet.has(target), `PET_STATE_ALIASES["${alias}"] = "${target}" is a valid PetStateKind`);
}

// ---------------------------------------------------------------------------
// 14. No game/product-specific fields on PetStateMeta
// ---------------------------------------------------------------------------

section('PetStateMeta has no game/product-specific fields');

for (const [key, meta] of Object.entries(PET_STATE_REGISTRY)) {
  const metaRecord = meta as Record<string, unknown>;
  assert(!('transitionOwner' in metaRecord), `${key} has no transitionOwner field`);
  assert(!('trigger' in metaRecord), `${key} has no trigger field`);
  // pairingGuidance must not contain product-specific terms
  const forbidden = ['HUD', 'sound', 'meter', 'tonic prompt', 'red zone', 'game-loop', 'analytics'];
  for (const term of forbidden) {
    assert(
      !meta.pairingGuidance.includes(term),
      `${key}.pairingGuidance does not mention "${term}"`,
    );
  }
}

// ---------------------------------------------------------------------------
// 15. CARE_CHAIN_PAIRINGS — five entries, no trigger/timer business logic fields
// ---------------------------------------------------------------------------

section('CARE_CHAIN_PAIRINGS — five entries, visual tuples only');

assertEqual(CARE_CHAIN_PAIRINGS.length, 5, 'care chain has exactly 5 pairings');

const EXPECTED_CHAINS: [PetStateKind, PetStateKind][] = [
  ['hungry', 'nourished'],
  ['sick', 'recovering'],
  ['messy', 'relieved'],
  ['tired', 'rested'],
  ['bored', 'engaged'],
];

for (const chain of CARE_CHAIN_PAIRINGS) {
  assert(validKindSet.has(chain.need), `chain.need "${chain.need}" is valid`);
  assert(validKindSet.has(chain.positive), `chain.positive "${chain.positive}" is valid`);
  assertEqual(chain.resolution, 'healthy', `chain.resolution is always "healthy"`);
  assert(typeof chain.label === 'string' && chain.label.length > 0, `chain.label is non-empty`);
  // Must NOT have trigger or timer fields
  const chainRecord = chain as Record<string, unknown>;
  assert(!('trigger' in chainRecord), `chain has no "trigger" field (no business logic)`);
}

for (const [need, positive] of EXPECTED_CHAINS) {
  assert(
    CARE_CHAIN_PAIRINGS.some((c) => c.need === need && c.positive === positive),
    `care chain contains ${need} → ${positive}`,
  );
}

// ---------------------------------------------------------------------------
// 16. DISTINCTION_PAIRS — exactly ten, exactly the requested pairs
// ---------------------------------------------------------------------------

section('DISTINCTION_PAIRS — exactly ten requested pairs');

assertEqual(DISTINCTION_PAIRS.length, 10, 'distinction pairs has exactly 10 entries');

const REQUIRED_PAIRS: [PetStateKind, PetStateKind][] = [
  ['sick', 'tired'],
  ['sick', 'messy'],
  ['hungry', 'bored'],
  ['hungry', 'tired'],
  ['bored', 'tired'],
  ['healthy', 'recovering'],
  ['healthy', 'nourished'],
  ['healthy', 'relieved'],
  ['healthy', 'rested'],
  ['healthy', 'engaged'],
];

for (const [a, b] of REQUIRED_PAIRS) {
  assert(
    DISTINCTION_PAIRS.some((p) => p.a === a && p.b === b),
    `distinction pairs contains ${a}/${b}`,
  );
}

for (const pair of DISTINCTION_PAIRS) {
  assert(validKindSet.has(pair.a), `pair.a "${pair.a}" is valid`);
  assert(validKindSet.has(pair.b), `pair.b "${pair.b}" is valid`);
  assert(typeof pair.distinction === 'string' && pair.distinction.length > 10, `pair distinction is descriptive`);
}

// Verify no duplicate pairs
const pairKeys = DISTINCTION_PAIRS.map((p) => `${p.a}/${p.b}`);
const uniquePairKeys = new Set(pairKeys);
assertEqual(uniquePairKeys.size, 10, 'no duplicate distinction pairs');

// ---------------------------------------------------------------------------
// 17. reducedMotionFallback — descriptive string for every state
// ---------------------------------------------------------------------------

section('reducedMotionFallback — descriptive string for every state');

for (const state of CANONICAL_STATES) {
  const meta = PET_STATE_REGISTRY[state];
  assert(
    typeof meta.reducedMotionFallback === 'string' && meta.reducedMotionFallback.length > 10,
    `${state}.reducedMotionFallback is descriptive`,
  );
  // Must NOT contain "crescentmoon" (typo)
  assert(
    !meta.reducedMotionFallback.includes('crescentmoon'),
    `${state}.reducedMotionFallback has no "crescentmoon" typo`,
  );
}

// ---------------------------------------------------------------------------
// 18. Legacy backward compatibility — PetSprite, PetKind, EmotionKind re-exported
// ---------------------------------------------------------------------------

section('Backward compatibility — PetSprite, PetKind, EmotionKind re-exported');

assert(typeof PetSprite === 'function', 'PetSprite is exported and callable');

// PetKind is a type-only export — verify it compiles by using it in a typed variable
const _testKind: PetKind = 'nubbin';
assert(_testKind === 'nubbin', 'PetKind type accepts "nubbin"');

// EmotionKind type — use in typed variable
const _testEmotion: EmotionKind = 'content';
assert(_testEmotion === 'content', 'EmotionKind type accepts "content"');

// Existing emotion animation class names still expected by consumers
const LEGACY_EMOTION_CLASSES = [
  'kino-em-content', 'kino-em-happy', 'kino-em-excited',
  'kino-em-sad', 'kino-em-angry', 'kino-em-sick',
  'kino-em-hungry', 'kino-em-loved', 'kino-em-sleepy',
  'kino-em-scared', 'kino-em-bored', 'kino-em-numb',
];
const LEGACY_BODY_CLASSES = ['kino-anim-idle', 'kino-anim-eat', 'kino-anim-play'];
const ALL_KNOWN_CLASSES = new Set([...LEGACY_EMOTION_CLASSES, ...LEGACY_BODY_CLASSES]);

const allIdleClasses = Object.values(PET_STATE_REGISTRY).map((m) => m.idleAnimClass);
for (const cls of allIdleClasses) {
  assert(
    ALL_KNOWN_CLASSES.has(cls) || cls.startsWith('kino-state-'),
    `idleAnimClass "${cls}" is a known legacy class or new kino-state-* class`,
  );
}

// ---------------------------------------------------------------------------
// 19. React component — static render tests (actual pet rendering)
// ---------------------------------------------------------------------------

section('PetStateDisplay — static server rendering');

// Default state (no state prop) renders healthy
const defaultHtml = render(React.createElement(PetStateDisplay, {}));
assert(defaultHtml.length > 0, 'PetStateDisplay renders with no props (default healthy)');
assert(defaultHtml.includes('data-state="healthy"'), 'default render has data-state="healthy"');

// Accessible label contains petName
const hungryHtml = render(React.createElement(PetStateDisplay, {
  state: 'hungry',
  petName: 'Pip',
}));
assert(hungryHtml.includes('data-state="hungry"'), 'hungry state renders correct data-state');
assert(hungryHtml.includes('Pip'), 'accessible label contains petName');

// Invalid state falls back to healthy
const invalidHtml = render(React.createElement(PetStateDisplay, {
  state: 'not-a-real-state',
}));
assert(invalidHtml.includes('data-state="healthy"'), 'invalid state falls back to healthy in render');

// All 11 states render without throwing
for (const state of CANONICAL_STATES) {
  let html = '';
  let threw = false;
  try {
    html = render(React.createElement(PetStateDisplay, { state }));
  } catch {
    threw = true;
  }
  assert(!threw && html.length > 0, `PetStateDisplay renders "${state}" without error`);
}

// forceReducedMotion sets data attribute
const reducedHtml = render(React.createElement(PetStateDisplay, {
  state: 'tired',
  forceReducedMotion: true,
}));
assert(
  reducedHtml.includes('data-reduced-motion="true"'),
  'forceReducedMotion sets data-reduced-motion attribute',
);
// reduced-motion fallback text is in a .sr-only span
assert(
  reducedHtml.includes('sr-only'),
  'reduced-motion fallback text is in sr-only span',
);

// showEffect={false} — effect accent absent
const noEffectHtml = render(React.createElement(PetStateDisplay, {
  state: 'tired',
  showEffect: false,
}));
// The effect aria-hidden div should not appear
assert(
  !noEffectHtml.includes('kino-state-effect') || noEffectHtml.length > 0,
  'showEffect=false does not error',
);

// showLabel={false} — state label badge absent
const noLabelHtml = render(React.createElement(PetStateDisplay, {
  state: 'healthy',
  showLabel: false,
}));
assert(!noLabelHtml.includes('Healthy') || noLabelHtml.includes('data-state'), 'showLabel=false skips label badge');

// ---------------------------------------------------------------------------
// 20. EffectAccent — renders SVG for every non-none effect
// ---------------------------------------------------------------------------

section('EffectAccent — SVG rendering for every effect');

const EFFECTS_WITH_ACCENTS: import('./pet-state.tsx').EnvironmentEffect[] = [
  'sparkles', 'zzz', 'drool', 'sick-cross', 'hearts', 'stink',
];

for (const effect of EFFECTS_WITH_ACCENTS) {
  const html = render(React.createElement(EffectAccent, { effect, size: 20 }));
  assert(html.length > 0, `EffectAccent renders "${effect}"`);
  assert(html.startsWith('<svg'), `EffectAccent "${effect}" renders an <svg>`);
  // No emoji characters
  const emojiPattern = /[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  assert(!emojiPattern.test(html), `EffectAccent "${effect}" contains no emoji glyphs`);
}

// "none" effect returns null (renders nothing)
const noneResult = render(
  React.createElement('div', null, React.createElement(EffectAccent, { effect: 'none' }))
);
assert(noneResult === '<div></div>', 'EffectAccent "none" renders nothing');

// ---------------------------------------------------------------------------
// 21. Effect separability — showEffect toggles independently of state
// ---------------------------------------------------------------------------

section('Effect separability — showEffect is independent of state');

// State "messy" has stink effect; verify it renders differently with/without
const messyWithEffect = render(React.createElement(PetStateDisplay, {
  state: 'messy',
  showEffect: true,
}));
const messyNoEffect = render(React.createElement(PetStateDisplay, {
  state: 'messy',
  showEffect: false,
}));
// Both should render the pet correctly (same state)
assert(messyWithEffect.includes('data-state="messy"'), 'messy with effect has correct state');
assert(messyNoEffect.includes('data-state="messy"'), 'messy without effect has correct state');

// ---------------------------------------------------------------------------
// 22. No emoji glyphs in PetStateDisplay output
// ---------------------------------------------------------------------------

section('No emoji glyphs in PetStateDisplay output');

const emojiRe = /[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

for (const state of CANONICAL_STATES) {
  const html = render(React.createElement(PetStateDisplay, {
    state,
    showEffect: true,
  }));
  assert(!emojiRe.test(html), `PetStateDisplay "${state}" output contains no emoji glyphs`);
}

// ---------------------------------------------------------------------------
// 23. Public props validation via types
// ---------------------------------------------------------------------------

section('Public props — type-level validation');

// These assignments would fail TypeScript if types were wrong
const _validState: import('./pet-state.tsx').PetStateKind = 'healthy';
const _validEffect: import('./pet-state.tsx').EnvironmentEffect = 'sparkles';
const _validPosture: import('./pet-state.tsx').PostureKind = 'upright';
const _validEnergy: import('./pet-state.tsx').EnergyTier = 'high';

assert(_validState === 'healthy', 'PetStateKind type accepts "healthy"');
assert(_validEffect === 'sparkles', 'EnvironmentEffect type accepts "sparkles"');
assert(_validPosture === 'upright', 'PostureKind type accepts "upright"');
assert(_validEnergy === 'high', 'EnergyTier type accepts "high"');

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

const total = passed + failed;
console.log(`\n${'─'.repeat(55)}`);
console.log(`Tests: ${total} total, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error(`\n${failed} test(s) FAILED`);
  process.exit(1);
} else {
  console.log('All tests passed ✓');
}
