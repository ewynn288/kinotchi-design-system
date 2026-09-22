import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Guidelines } from '../preview/parts';

// ---------------------------------------------------------------------------
// TAXONOMY — original Kinotchi creatures, three habitat branches
// ---------------------------------------------------------------------------

/** Public re-export so consumers can type pet kind without importing internals */
export type PetKind =
  // Universal
  | 'nubbin'   // baby (universal, neutral)
  // Grove branch
  | 'twiglet'  // grove young
  | 'pebblur'  // grove young (rounder)
  | 'thornlet' // grove young (spiky)
  | 'mosswick' // grove mature — mossy log body
  | 'bramblox' // grove mature — thorny bold round
  | 'fernwing' // grove mature — leaf-winged flier
  | 'gloomoak' // grove rare   — dark hollow-tree form
  // Tide branch
  | 'blubkin'  // tide young
  | 'splotch'  // tide young (splat shaped)
  | 'gillby'   // tide young (finned)
  | 'coraloom' // tide mature — coral crown
  | 'driftmaw' // tide mature — wide-jaw glider
  | 'inkwhirl' // tide mature — squid-like spinner
  | 'abyssling'// tide rare   — deep-glow form
  // Zephyr branch
  | 'pufflet'  // zephyr young
  | 'driftoo'  // zephyr young (wispy)
  | 'stormite' // zephyr young (charged)
  | 'cumulus'  // zephyr mature — cloud-puff wide
  | 'sparkave' // zephyr mature — electric bird
  | 'mistveil' // zephyr mature — translucent cloak
  | 'tempestri';// zephyr rare   — storm-eye form

type PetStage = 'baby' | 'young' | 'mature' | 'rare';
type Branch = 'grove' | 'tide' | 'zephyr';

// Palette used across sprites
const C = {
  outline: '#074F9A',
  face: '#073B5C',
  // Grove
  grovePrimary: '#73C95D',
  groveSecondary: '#B6E56E',
  groveDark: '#3D7A2B',
  groveStem: '#C97D3D',
  // Tide
  tidePrimary: '#50D7E3',
  tideSecondary: '#83DFF0',
  tideDark: '#0A58CA',
  tideAccent: '#FF80B5',
  // Zephyr
  zephyrPrimary: '#B8B8F8',
  zephyrSecondary: '#D8D3FF',
  zephyrDark: '#5E4FD6',
  zephyrAccent: '#FFE347',
  // Shared accents
  blush: '#FF5D8F',
  sun: '#FFD84A',
  cream: '#FFF4BE',
};

// ---------------------------------------------------------------------------
// PetSprite — SVG artwork per creature kind
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// EatingFace — dedicated chewing face overlaid during the eating body state.
// Positioned in the universal 120×120 viewBox coordinate system, centered at
// cx=60 cy=70 to match the average face position of all four preview pets.
// All animated elements carry kino-eat-* classes so play-state can be toggled.
// ---------------------------------------------------------------------------

function EatingFace({ playState }: { playState?: 'running' | 'paused' }) {
  const ps = playState ?? 'running';
  // eye positions — mirrored around cx=60
  const eyeLx = 47, eyeRx = 73, eyeY = 65, eyeR = 4.5;
  // mouth anchor
  const mouthCx = 60, mouthCy = 78;

  return (
    <g aria-hidden="true">
      {/* ── Left eye — squints during chomp ── */}
      <g
        className="kino-eat-eye"
        style={{ animationPlayState: ps, transformOrigin: `${eyeLx}px ${eyeY}px`, transformBox: 'view-box' }}
      >
        <circle cx={eyeLx} cy={eyeY} r={eyeR} fill={C.face} />
        {/* tiny white gleam */}
        <circle cx={eyeLx + 1.5} cy={eyeY - 1.5} r={1.5} fill="white" opacity="0.85" />
      </g>

      {/* ── Right eye — squints during chomp ── */}
      <g
        className="kino-eat-eye"
        style={{ animationPlayState: ps, transformOrigin: `${eyeRx}px ${eyeY}px`, transformBox: 'view-box' }}
      >
        <circle cx={eyeRx} cy={eyeY} r={eyeR} fill={C.face} />
        <circle cx={eyeRx + 1.5} cy={eyeY - 1.5} r={1.5} fill="white" opacity="0.85" />
      </g>

      {/* ── Blush circles — static, always visible ── */}
      <circle cx={eyeLx - 6} cy={eyeY + 7} r={3.5} fill={C.blush} opacity="0.55" />
      <circle cx={eyeRx + 6} cy={eyeY + 7} r={3.5} fill={C.blush} opacity="0.55" />

      {/* ── Chomping mouth group — jaw scaleY animates ── */}
      <g
        className="kino-eat-mouth"
        style={{ animationPlayState: ps, transformOrigin: `${mouthCx}px ${mouthCy - 3}px`, transformBox: 'view-box' }}
      >
        {/* open mouth cavity */}
        <ellipse
          cx={mouthCx} cy={mouthCy + 1}
          rx="10" ry="6"
          fill="#073B5C"
        />
        {/* upper lip arch */}
        <path
          d={`M${mouthCx - 10} ${mouthCy - 2} Q${mouthCx} ${mouthCy - 9} ${mouthCx + 10} ${mouthCy - 2}`}
          fill="none" stroke={C.face} strokeWidth="3.5" strokeLinecap="round"
        />
        {/* lower lip */}
        <path
          d={`M${mouthCx - 10} ${mouthCy + 5} Q${mouthCx} ${mouthCy + 10} ${mouthCx + 10} ${mouthCy + 5}`}
          fill="none" stroke={C.face} strokeWidth="3" strokeLinecap="round"
        />
        {/* food chunk peeking at left corner — warm orange with highlight */}
        <rect
          x={mouthCx - 13} y={mouthCy - 4}
          width="7" height="6" rx="2"
          fill="#FF8C3A" stroke="#D96000" strokeWidth="1.5"
        />
        <rect
          x={mouthCx - 12} y={mouthCy - 3}
          width="2.5" height="2" rx="0.5"
          fill="#FFB870" opacity="0.9"
        />
      </g>

      {/* ── Crumbs — each crumb falls and fades, resets on next iteration ── */}
      {/* Crumb A — small orange square, left of mouth */}
      <g
        className="kino-eat-crumb-a"
        style={{ animationPlayState: ps, transformOrigin: `${mouthCx - 8}px ${mouthCy - 8}px`, transformBox: 'view-box' }}
      >
        <rect x={mouthCx - 10} y={mouthCy - 10} width="4" height="4" rx="1" fill="#FF8C3A" stroke="#D96000" strokeWidth="1" />
      </g>

      {/* Crumb B — yellow dot, right of mouth */}
      <g
        className="kino-eat-crumb-b"
        style={{ animationPlayState: ps, transformOrigin: `${mouthCx + 9}px ${mouthCy - 7}px`, transformBox: 'view-box' }}
      >
        <circle cx={mouthCx + 9} cy={mouthCy - 7} r="2.5" fill={C.sun} stroke="#D4920A" strokeWidth="1" />
      </g>

      {/* Crumb C — small round crumb, slightly left-center */}
      <g
        className="kino-eat-crumb-c"
        style={{ animationPlayState: ps, transformOrigin: `${mouthCx - 3}px ${mouthCy - 12}px`, transformBox: 'view-box' }}
      >
        <circle cx={mouthCx - 3} cy={mouthCy - 12} r="2" fill="#FF8C3A" opacity="0.9" />
      </g>

      {/* Crumb D — tiny square, far right */}
      <g
        className="kino-eat-crumb-d"
        style={{ animationPlayState: ps, transformOrigin: `${mouthCx + 14}px ${mouthCy - 5}px`, transformBox: 'view-box' }}
      >
        <rect x={mouthCx + 12} y={mouthCy - 7} width="3.5" height="3.5" rx="0.8" fill={C.sun} stroke="#D4920A" strokeWidth="0.8" />
      </g>
    </g>
  );
}

/** Public re-export — import PetSprite from kinotchi.tsx for all pet rendering */
export function PetSprite({
  kind,
  size = 'md',
  label,
  decorative = false,
  hideFace = false,
  emotion,
  emotionAnimClass,
  emotionPlayState,
  eatingFace = false,
  eatingPlayState,
}: {
  kind: PetKind;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  /** Hide the sprite from assistive technology when a semantic wrapper owns the label. */
  decorative?: boolean;
  hideFace?: boolean;
  emotion?: EmotionKind;
  /** CSS animation class to apply to the face <g> only */
  emotionAnimClass?: string;
  /** animation-play-state for the face <g> */
  emotionPlayState?: 'running' | 'paused';
  /** When true, renders the dedicated eating face and suppresses the body/emotion face */
  eatingFace?: boolean;
  /** animation-play-state forwarded to the eating face's animated elements */
  eatingPlayState?: 'running' | 'paused';
}) {
  const dims = { sm: 'h-16 w-16', md: 'h-24 w-24', lg: 'h-32 w-32' };
  const sw = 5.5; // stroke-width base
  // When eating face is active, suppress the body-sprite's built-in face
  const suppressFace = hideFace || eatingFace;

  return (
    <div
      className={`relative ${dims[size]}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label ?? kind}
      aria-hidden={decorative ? true : undefined}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full overflow-visible" aria-hidden="true">
        {/* ---- UNIVERSAL BABY ---- */}
        {kind === 'nubbin' && <NubbinSprite sw={sw} hideFace={suppressFace} />}

        {/* ---- GROVE YOUNG ---- */}
        {kind === 'twiglet' && <TwigletSprite sw={sw} hideFace={suppressFace} />}
        {kind === 'pebblur' && <PebblurSprite sw={sw} />}
        {kind === 'thornlet' && <ThornletSprite sw={sw} />}

        {/* ---- GROVE MATURE / RARE ---- */}
        {kind === 'mosswick' && <MosswickSprite sw={sw} />}
        {kind === 'bramblox' && <BrambloxSprite sw={sw} />}
        {kind === 'fernwing' && <FernwingSprite sw={sw} />}
        {kind === 'gloomoak' && <GloomoakSprite sw={sw} />}

        {/* ---- TIDE YOUNG ---- */}
        {kind === 'blubkin' && <BlubkinSprite sw={sw} hideFace={suppressFace} />}
        {kind === 'splotch' && <SplotchSprite sw={sw} />}
        {kind === 'gillby' && <GillbySprite sw={sw} />}

        {/* ---- TIDE MATURE / RARE ---- */}
        {kind === 'coraloom' && <CoraloomSprite sw={sw} />}
        {kind === 'driftmaw' && <DriftmawSprite sw={sw} />}
        {kind === 'inkwhirl' && <InkwhirlSprite sw={sw} />}
        {kind === 'abyssling' && <AbysslingSprite sw={sw} />}

        {/* ---- ZEPHYR YOUNG ---- */}
        {kind === 'pufflet' && <PuffletSprite sw={sw} hideFace={suppressFace} />}
        {kind === 'driftoo' && <DriftooSprite sw={sw} />}
        {kind === 'stormite' && <StormiteSprite sw={sw} />}

        {/* ---- ZEPHYR MATURE / RARE ---- */}
        {kind === 'cumulus' && <CumulusSprite sw={sw} />}
        {kind === 'sparkave' && <SparkaveSprite sw={sw} />}
        {kind === 'mistveil' && <MistveilSprite sw={sw} />}
        {kind === 'tempestri' && <TempestriSprite sw={sw} />}

        {/* Eating face — replaces built-in and emotion face during eating state */}
        {eatingFace && <EatingFace playState={eatingPlayState} />}

        {/* Emotion face layer — wrapped in a <g> so the emotion animation targets
            only the face geometry and not the body silhouette.
            Suppressed when eating face is active. */}
        {!eatingFace && emotion && (
          <g
            className={emotionAnimClass ?? ''}
            style={{
              animationPlayState: emotionPlayState,
              transformBox: 'view-box',
              transformOrigin: '60px 60px',
            }}
          >
            <EmotionFaceLayer kind={emotion} />
          </g>
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual sprite components
// ---------------------------------------------------------------------------

function Face({ cx = 60, cy = 66, eyeR = 5, mouthY = 80, blushX = [38, 82] }: {
  cx?: number; cy?: number; eyeR?: number; mouthY?: number; blushX?: [number, number];
}) {
  const eyeSpread = eyeR * 4.5;
  return (
    <>
      <circle cx={cx - eyeSpread / 2} cy={cy} r={eyeR} fill={C.face} />
      <circle cx={cx + eyeSpread / 2} cy={cy} r={eyeR} fill={C.face} />
      <path d={`M${cx - eyeR * 1.4} ${mouthY} q${eyeR * 1.4} ${eyeR * 1.4} ${eyeR * 2.8} 0`} fill="none" stroke={C.face} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={blushX[0]} cy={cy + 6} r={eyeR - 1} fill={C.blush} opacity=".6" />
      <circle cx={blushX[1]} cy={cy + 6} r={eyeR - 1} fill={C.blush} opacity=".6" />
    </>
  );
}

function NubbinSprite({ sw, hideFace = false }: { sw: number; hideFace?: boolean }) {
  // Tiny round cream-coloured baby with a habitat-neutral signal bead
  return (
    <>
      <ellipse cx="60" cy="70" rx="28" ry="26" fill={C.cream} stroke={C.outline} strokeWidth={sw} />
      <path d="M58 44 C54 37 57 31 63 32 C68 33 68 39 64 43" fill="none" stroke={C.outline} strokeWidth="4" strokeLinecap="round" />
      <circle cx="63" cy="32" r="5" fill={C.sun} stroke={C.outline} strokeWidth="3" />
      {!hideFace && <Face cy={68} eyeR={4} mouthY={78} blushX={[47, 73]} />}
    </>
  );
}

function TwigletSprite({ sw, hideFace = false }: { sw: number; hideFace?: boolean }) {
  // Small upright body with two tiny branch arms
  return (
    <>
      {/* arms */}
      <path d="M30 62 C20 55 18 47 26 46" fill="none" stroke={C.groveStem} strokeWidth={sw} strokeLinecap="round" />
      <path d="M90 62 C100 55 102 47 94 46" fill="none" stroke={C.groveStem} strokeWidth={sw} strokeLinecap="round" />
      {/* body */}
      <ellipse cx="60" cy="70" rx="30" ry="28" fill={C.grovePrimary} stroke={C.outline} strokeWidth={sw} />
      {/* stem top */}
      <path d="M57 42 C55 30 65 26 65 38 L62 42Z" fill={C.groveStem} stroke={C.outline} strokeWidth="4" strokeLinejoin="round" />
      <path d="M62 35 C66 28 73 30 70 37" fill={C.groveSecondary} stroke={C.outline} strokeWidth="3.5" strokeLinejoin="round" />
      {!hideFace && <Face cy={68} eyeR={4.5} mouthY={80} blushX={[43, 77]} />}
    </>
  );
}

function PebblurSprite({ sw }: { sw: number }) {
  // Squat oval body, tiny pebble markings
  return (
    <>
      <ellipse cx="60" cy="72" rx="33" ry="26" fill="#C8D8A2" stroke={C.outline} strokeWidth={sw} />
      {/* pebble spots */}
      <ellipse cx="42" cy="80" rx="6" ry="4" fill="#A4BC7A" stroke={C.outline} strokeWidth="3" />
      <ellipse cx="62" cy="86" rx="7" ry="4.5" fill="#A4BC7A" stroke={C.outline} strokeWidth="3" />
      <ellipse cx="80" cy="79" rx="5" ry="3.5" fill="#A4BC7A" stroke={C.outline} strokeWidth="3" />
      <Face cy={64} eyeR={4.5} mouthY={74} blushX={[41, 79]} />
    </>
  );
}

function ThornletSprite({ sw }: { sw: number }) {
  // Round but with several triangular spikes
  return (
    <>
      {/* spikes */}
      {([[-20, -20], [0, -28], [20, -20], [28, 0], [20, 20]] as [number, number][]).map(([dx, dy], i) => (
        <polygon key={i} points={`${60 + dx * 0.7},${70 + dy * 0.7} ${60 + dx - 6},${70 + dy + 3} ${60 + dx + 6},${70 + dy + 3}`}
          fill={C.groveDark} stroke={C.outline} strokeWidth="3" strokeLinejoin="round" />
      ))}
      <circle cx="60" cy="70" r="28" fill={C.grovePrimary} stroke={C.outline} strokeWidth={sw} />
      <Face cy={68} eyeR={4.5} mouthY={79} blushX={[43, 77]} />
    </>
  );
}

function MosswickSprite({ sw }: { sw: number }) {
  // Log-shaped wide body, mossy head tuft, stubby legs
  return (
    <>
      {/* log body */}
      <rect x="20" y="58" width="80" height="46" rx="16" fill={C.groveStem} stroke={C.outline} strokeWidth={sw} />
      {/* grain lines */}
      <path d="M36 70 Q60 66 84 70" fill="none" stroke="#9B6330" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 82 Q60 78 90 82" fill="none" stroke="#9B6330" strokeWidth="3" strokeLinecap="round" />
      {/* moss tuft */}
      <ellipse cx="60" cy="58" rx="28" ry="16" fill={C.grovePrimary} stroke={C.outline} strokeWidth={sw} />
      <ellipse cx="42" cy="52" rx="10" ry="8" fill={C.groveSecondary} stroke={C.outline} strokeWidth="4" />
      <ellipse cx="60" cy="46" rx="12" ry="9" fill={C.groveSecondary} stroke={C.outline} strokeWidth="4" />
      <ellipse cx="78" cy="52" rx="10" ry="8" fill={C.groveSecondary} stroke={C.outline} strokeWidth="4" />
      {/* legs */}
      <rect x="30" y="100" width="16" height="12" rx="6" fill={C.groveStem} stroke={C.outline} strokeWidth="4" />
      <rect x="74" y="100" width="16" height="12" rx="6" fill={C.groveStem} stroke={C.outline} strokeWidth="4" />
      <Face cx={60} cy={60} eyeR={5} mouthY={70} blushX={[41, 79]} />
    </>
  );
}

function BrambloxSprite({ sw }: { sw: number }) {
  // Very round with bold thorns all around, grumpy-cute face
  return (
    <>
      {([
        [60, 26, 0],
        [82, 32, 30],
        [94, 52, 60],
        [88, 76, 100],
        [32, 76, -100],
        [26, 52, -60],
        [38, 32, -30],
      ] as [number, number, number][]).map(([tx, ty, rot], i) => (
        <polygon key={i}
          points={`${tx},${ty} ${tx - 6},${ty + 10} ${tx + 6},${ty + 10}`}
          fill={C.groveDark}
          stroke={C.outline}
          strokeWidth="3"
          strokeLinejoin="round"
          transform={`rotate(${rot} ${tx} ${ty})`}
        />
      ))}
      <circle cx="60" cy="62" r="32" fill="#4CAF35" stroke={C.outline} strokeWidth={sw} />
      {/* white belly */}
      <ellipse cx="60" cy="70" rx="18" ry="14" fill="#D6F4B0" stroke="none" />
      <Face cy={66} eyeR={5} mouthY={76} blushX={[42, 78]} />
    </>
  );
}

function FernwingSprite({ sw }: { sw: number }) {
  // Winged creature, leaf-shaped wings, streamlined body
  return (
    <>
      {/* wings */}
      <path d="M28 60 C8 44 4 24 22 26 C36 28 42 46 40 60Z" fill={C.groveSecondary} stroke={C.outline} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M92 60 C112 44 116 24 98 26 C84 28 78 46 80 60Z" fill={C.groveSecondary} stroke={C.outline} strokeWidth={sw} strokeLinejoin="round" />
      {/* wing veins */}
      <path d="M28 60 C22 46 24 32 28 26" fill="none" stroke={C.groveDark} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M92 60 C98 46 96 32 92 26" fill="none" stroke={C.groveDark} strokeWidth="2.5" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="60" cy="66" rx="24" ry="28" fill={C.grovePrimary} stroke={C.outline} strokeWidth={sw} />
      {/* tail feather */}
      <path d="M52 92 C44 104 56 112 60 106 C64 112 76 104 68 92Z" fill={C.groveSecondary} stroke={C.outline} strokeWidth="4" strokeLinejoin="round" />
      <Face cy={62} eyeR={5} mouthY={73} blushX={[42, 78]} />
    </>
  );
}

function GloomoakSprite({ sw }: { sw: number }) {
  // Rare: hollow dark tree form, glowing eye, spectral wisps
  return (
    <>
      {/* wisps */}
      <path d="M18 46 C10 38 14 28 22 32 C26 34 24 42 18 46Z" fill="#7B5EA7" stroke={C.outline} strokeWidth="3.5" />
      <path d="M102 46 C110 38 106 28 98 32 C94 34 96 42 102 46Z" fill="#7B5EA7" stroke={C.outline} strokeWidth="3.5" />
      <path d="M30 28 C26 18 34 12 38 20 C40 24 36 28 30 28Z" fill="#9E7AC8" stroke={C.outline} strokeWidth="3" />
      {/* hollow trunk body */}
      <path d="M34 56 C28 38 36 22 60 20 C84 22 92 38 86 56 L80 104 C74 112 46 112 40 104Z"
        fill="#2A1F3D" stroke={C.outline} strokeWidth={sw} />
      {/* hollow opening */}
      <ellipse cx="60" cy="64" rx="16" ry="20" fill="#1A1028" stroke="#5B3E82" strokeWidth="3" />
      {/* glow eyes */}
      <circle cx="54" cy="60" r="5" fill="#C8A8FF" />
      <circle cx="66" cy="60" r="5" fill="#C8A8FF" />
      <circle cx="54" cy="60" r="2.5" fill="white" />
      <circle cx="66" cy="60" r="2.5" fill="white" />
      {/* root feet */}
      <path d="M40 104 C34 112 28 116 26 110" fill="none" stroke={C.outline} strokeWidth={sw} strokeLinecap="round" />
      <path d="M50 108 C48 116 44 120 40 116" fill="none" stroke={C.outline} strokeWidth={sw} strokeLinecap="round" />
      <path d="M80 104 C86 112 92 116 94 110" fill="none" stroke={C.outline} strokeWidth={sw} strokeLinecap="round" />
      <path d="M70 108 C72 116 76 120 80 116" fill="none" stroke={C.outline} strokeWidth={sw} strokeLinecap="round" />
      {/* sparkles */}
      <circle cx="22" cy="70" r="3" fill="#FFE347" />
      <circle cx="98" cy="70" r="3" fill="#FFE347" />
      <circle cx="42" cy="20" r="2.5" fill="#C8A8FF" />
    </>
  );
}

function BlubkinSprite({ sw, hideFace = false }: { sw: number; hideFace?: boolean }) {
  // Round water-drop shaped, small fin on top
  return (
    <>
      <path d="M60 26 C50 38 34 52 34 68 C34 86 46 98 60 98 C74 98 86 86 86 68 C86 52 70 38 60 26Z"
        fill={C.tidePrimary} stroke={C.outline} strokeWidth={sw} />
      {/* fin */}
      <path d="M54 34 C50 22 62 18 64 28 L60 34Z" fill={C.tideSecondary} stroke={C.outline} strokeWidth="4" strokeLinejoin="round" />
      {!hideFace && <Face cy={70} eyeR={4.5} mouthY={81} blushX={[44, 76]} />}
    </>
  );
}

function SplotchSprite({ sw }: { sw: number }) {
  // Asymmetric splat shape, irregular blob
  return (
    <>
      <path d="M60 28 C76 24 94 36 98 56 C102 72 92 92 74 98 C58 104 38 98 30 84 C20 68 28 44 44 34 C50 30 56 28 60 28Z"
        fill="#68C8F8" stroke={C.outline} strokeWidth={sw} />
      {/* spot markings */}
      <circle cx="76" cy="72" r="7" fill="#A4E0F8" stroke={C.outline} strokeWidth="3" />
      <circle cx="46" cy="78" r="5" fill="#A4E0F8" stroke={C.outline} strokeWidth="3" />
      <Face cx={58} cy={62} eyeR={4.5} mouthY={73} blushX={[42, 74]} />
    </>
  );
}

function GillbySprite({ sw }: { sw: number }) {
  // Rounded fish body, large side fins, tail fin
  return (
    <>
      {/* tail */}
      <path d="M88 68 C104 58 108 82 88 76Z" fill={C.tideSecondary} stroke={C.outline} strokeWidth={sw} strokeLinejoin="round" />
      {/* fins */}
      <path d="M36 52 C22 40 16 56 28 60Z" fill={C.tideSecondary} stroke={C.outline} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M36 82 C22 90 20 76 32 72Z" fill={C.tideSecondary} stroke={C.outline} strokeWidth={sw} strokeLinejoin="round" />
      {/* body */}
      <ellipse cx="58" cy="68" rx="30" ry="26" fill={C.tidePrimary} stroke={C.outline} strokeWidth={sw} />
      {/* gill marks */}
      <path d="M44 58 C42 66 42 74 44 80" fill="none" stroke={C.tideDark} strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <Face cx={54} cy={66} eyeR={5} mouthY={76} blushX={[36, 72]} />
    </>
  );
}

function CoraloomSprite({ sw }: { sw: number }) {
  // Rounded body with elaborate coral crown
  return (
    <>
      {/* body */}
      <ellipse cx="60" cy="74" rx="28" ry="26" fill={C.tidePrimary} stroke={C.outline} strokeWidth={sw} />
      {/* belly */}
      <ellipse cx="60" cy="80" rx="16" ry="12" fill={C.tideSecondary} stroke="none" />
      {/* coral crown branches */}
      <path d="M44 50 C40 38 44 28 48 34 C50 38 46 44 44 50Z" fill="#FF6A88" stroke={C.outline} strokeWidth="4" />
      <path d="M44 46 C36 36 36 26 42 30 C46 33 44 42 44 46Z" fill="#FF88A4" stroke={C.outline} strokeWidth="3.5" />
      <path d="M60 46 C58 34 62 24 64 32 C65 38 62 44 60 46Z" fill="#FF5070" stroke={C.outline} strokeWidth="4" />
      <path d="M76 50 C80 38 76 28 72 34 C70 38 74 44 76 50Z" fill="#FF6A88" stroke={C.outline} strokeWidth="4" />
      <path d="M76 46 C84 36 84 26 78 30 C74 33 76 42 76 46Z" fill="#FF88A4" stroke={C.outline} strokeWidth="3.5" />
      {/* crown base */}
      <ellipse cx="60" cy="52" rx="22" ry="8" fill="#FF8CB8" stroke={C.outline} strokeWidth="4" />
      <Face cy={72} eyeR={5} mouthY={83} blushX={[42, 78]} />
    </>
  );
}

function DriftmawSprite({ sw }: { sw: number }) {
  // Wide flat body like a manta, large gaping smile
  return (
    <>
      {/* wings */}
      <path d="M16 66 C4 52 8 36 22 44 C32 50 36 62 32 74Z" fill={C.tideSecondary} stroke={C.outline} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M104 66 C116 52 112 36 98 44 C88 50 84 62 88 74Z" fill={C.tideSecondary} stroke={C.outline} strokeWidth={sw} strokeLinejoin="round" />
      {/* tail */}
      <path d="M50 98 C46 112 54 118 60 112 C66 118 74 112 70 98Z" fill={C.tideSecondary} stroke={C.outline} strokeWidth="4" strokeLinejoin="round" />
      {/* body */}
      <ellipse cx="60" cy="70" rx="30" ry="22" fill="#3EC8D4" stroke={C.outline} strokeWidth={sw} />
      {/* wide mouth */}
      <path d="M42 78 C50 90 70 90 78 78" fill="none" stroke={C.face} strokeWidth="4.5" strokeLinecap="round" />
      {/* eyes wide apart */}
      <circle cx="40" cy="64" r="6" fill={C.face} />
      <circle cx="80" cy="64" r="6" fill={C.face} />
      <circle cx="42" cy="62" r="2" fill="white" />
      <circle cx="82" cy="62" r="2" fill="white" />
    </>
  );
}

function InkwhirlSprite({ sw }: { sw: number }) {
  // Squid-like body, tentacles below, star pattern on mantle
  return (
    <>
      {/* tentacles */}
      {([36, 46, 56, 66, 76, 84] as number[]).map((x, i) => (
        <path key={i} d={`M${x} 96 C${x - 4} 106 ${x + 4} 112 ${x} 118`}
          fill="none" stroke="#6644BB" strokeWidth="5" strokeLinecap="round" />
      ))}
      {/* mantle */}
      <path d="M30 58 C30 36 90 36 90 58 L84 96 H36Z" fill="#8B66D4" stroke={C.outline} strokeWidth={sw} strokeLinejoin="round" />
      {/* star pattern */}
      <path d="M60 46 l3 7 7 1 -5 5 1 7 -6 -4 -6 4 1 -7 -5 -5 7 -1 3 -7Z" fill="#C4A8FF" stroke={C.outline} strokeWidth="2.5" />
      {/* mantle tip */}
      <path d="M46 36 C44 24 60 18 74 36Z" fill="#8B66D4" stroke={C.outline} strokeWidth="4" strokeLinejoin="round" />
      {/* eyes */}
      <circle cx="46" cy="62" r="6" fill="white" stroke={C.outline} strokeWidth="3" />
      <circle cx="74" cy="62" r="6" fill="white" stroke={C.outline} strokeWidth="3" />
      <circle cx="46" cy="62" r="3.5" fill={C.face} />
      <circle cx="74" cy="62" r="3.5" fill={C.face} />
    </>
  );
}

function AbysslingSprite({ sw }: { sw: number }) {
  // Rare: deep sea lantern body, bioluminescent glow, trailing tendrils
  return (
    <>
      {/* tendrils */}
      <path d="M42 100 C38 112 34 118 38 120" fill="none" stroke="#00BFBF" strokeWidth="4" strokeLinecap="round" />
      <path d="M54 104 C52 116 50 120 54 122" fill="none" stroke="#00BFBF" strokeWidth="4" strokeLinecap="round" />
      <path d="M70 104 C72 116 74 120 70 122" fill="none" stroke="#00BFBF" strokeWidth="4" strokeLinecap="round" />
      <path d="M82 100 C86 112 90 118 86 120" fill="none" stroke="#00BFBF" strokeWidth="4" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="60" cy="70" rx="28" ry="24" fill="#0A2A5E" stroke={C.outline} strokeWidth={sw} />
      {/* glow rim */}
      <ellipse cx="60" cy="70" rx="22" ry="18" fill="none" stroke="#00BFBF" strokeWidth="3" opacity=".7" />
      {/* lantern lure */}
      <line x1="60" y1="46" x2="60" y2="34" stroke="#00E8C8" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="60" cy="30" r="8" fill="#00E8C8" stroke={C.outline} strokeWidth="3.5" />
      <circle cx="60" cy="30" r="4" fill="white" opacity=".9" />
      {/* eyes glow */}
      <circle cx="48" cy="68" r="7" fill="#00BFBF" />
      <circle cx="72" cy="68" r="7" fill="#00BFBF" />
      <circle cx="48" cy="68" r="3.5" fill={C.face} />
      <circle cx="72" cy="68" r="3.5" fill={C.face} />
      {/* glow dots */}
      <circle cx="32" cy="56" r="3" fill="#00E8C8" opacity=".8" />
      <circle cx="88" cy="56" r="3" fill="#00E8C8" opacity=".8" />
      <circle cx="28" cy="76" r="2" fill="#00E8C8" opacity=".6" />
      <circle cx="92" cy="76" r="2" fill="#00E8C8" opacity=".6" />
    </>
  );
}

function PuffletSprite({ sw, hideFace = false }: { sw: number; hideFace?: boolean }) {
  // Very round fluffy cloud puff, small
  return (
    <>
      {/* bumps */}
      <circle cx="38" cy="58" r="16" fill={C.zephyrPrimary} stroke={C.outline} strokeWidth={sw} />
      <circle cx="82" cy="58" r="16" fill={C.zephyrPrimary} stroke={C.outline} strokeWidth={sw} />
      <circle cx="60" cy="50" r="20" fill={C.zephyrPrimary} stroke={C.outline} strokeWidth={sw} />
      {/* base */}
      <rect x="30" y="62" width="60" height="28" rx="14" fill={C.zephyrPrimary} stroke={C.outline} strokeWidth={sw} />
      {!hideFace && <Face cy={72} eyeR={4.5} mouthY={81} blushX={[42, 78]} />}
    </>
  );
}

function DriftooSprite({ sw }: { sw: number }) {
  // Wispy jellyfish-like, long trailing streamers
  return (
    <>
      {/* streamers */}
      {([34, 46, 60, 74, 86] as number[]).map((x, i) => (
        <path key={i} d={`M${x} 90 C${x - 8 + i * 2} 100 ${x + 6 - i} 110 ${x - 4 + i * 3} 118`}
          fill="none" stroke={C.zephyrSecondary} strokeWidth="4.5" strokeLinecap="round" />
      ))}
      {/* bell */}
      <path d="M22 66 C22 44 98 44 98 66 Q96 94 60 94 Q24 94 22 66Z"
        fill={C.zephyrSecondary} stroke={C.outline} strokeWidth={sw} />
      {/* inner glow */}
      <path d="M34 66 C34 52 86 52 86 66 Q84 84 60 84 Q36 84 34 66Z" fill={C.zephyrPrimary} stroke="none" opacity=".5" />
      <Face cy={66} eyeR={4.5} mouthY={76} blushX={[42, 78]} />
    </>
  );
}

function StormiteSprite({ sw }: { sw: number }) {
  // Charged round body with lightning bolt antennae
  return (
    <>
      {/* antennae */}
      <path d="M46 42 L50 32 L44 28 L52 16" fill="none" stroke={C.zephyrAccent} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M74 42 L70 32 L76 28 L68 16" fill="none" stroke={C.zephyrAccent} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="52" cy="14" r="5" fill={C.zephyrAccent} stroke={C.outline} strokeWidth="3.5" />
      <circle cx="68" cy="14" r="5" fill={C.zephyrAccent} stroke={C.outline} strokeWidth="3.5" />
      {/* body */}
      <ellipse cx="60" cy="72" rx="30" ry="28" fill="#A090F0" stroke={C.outline} strokeWidth={sw} />
      {/* charge stripes */}
      <path d="M46 62 L54 58 L50 70 L58 66" fill="none" stroke={C.zephyrAccent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
      <path d="M64 66 L72 62 L68 74 L76 70" fill="none" stroke={C.zephyrAccent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
      <Face cy={74} eyeR={5} mouthY={85} blushX={[42, 78]} />
    </>
  );
}

function CumulusSprite({ sw }: { sw: number }) {
  // Wide proud cloud body, big bumps, rosy cheeks, tiny legs
  return (
    <>
      {/* big cloud bumps */}
      <circle cx="28" cy="66" r="22" fill={C.zephyrSecondary} stroke={C.outline} strokeWidth={sw} />
      <circle cx="92" cy="66" r="22" fill={C.zephyrSecondary} stroke={C.outline} strokeWidth={sw} />
      <circle cx="60" cy="52" r="28" fill={C.zephyrSecondary} stroke={C.outline} strokeWidth={sw} />
      {/* base fill */}
      <rect x="18" y="68" width="84" height="32" rx="12" fill={C.zephyrSecondary} stroke={C.outline} strokeWidth={sw} />
      {/* inner highlight */}
      <ellipse cx="60" cy="56" rx="18" ry="14" fill="white" opacity=".4" />
      {/* tiny legs */}
      <rect x="38" y="96" width="14" height="12" rx="6" fill={C.zephyrPrimary} stroke={C.outline} strokeWidth="4" />
      <rect x="68" y="96" width="14" height="12" rx="6" fill={C.zephyrPrimary} stroke={C.outline} strokeWidth="4" />
      <Face cx={60} cy={70} eyeR={5.5} mouthY={81} blushX={[38, 82]} />
    </>
  );
}

function SparkaveSprite({ sw }: { sw: number }) {
  // Electric bird, angular wings, bolt crest, feathered tail
  return (
    <>
      {/* wings */}
      <path d="M34 58 C16 46 10 28 24 30 C34 32 40 48 38 64Z" fill={C.zephyrAccent} stroke={C.outline} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M86 58 C104 46 110 28 96 30 C86 32 80 48 82 64Z" fill={C.zephyrAccent} stroke={C.outline} strokeWidth={sw} strokeLinejoin="round" />
      {/* body */}
      <ellipse cx="60" cy="68" rx="24" ry="26" fill="#F0C030" stroke={C.outline} strokeWidth={sw} />
      {/* crest lightning bolt */}
      <path d="M56 44 L64 34 L58 30 L66 18" fill="none" stroke={C.outline} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M57 44 L65 34 L59 30 L67 18" fill="none" stroke={C.zephyrAccent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* tail */}
      <path d="M46 92 C38 106 46 114 54 108 L60 100 L66 108 C74 114 82 106 74 92Z" fill={C.zephyrAccent} stroke={C.outline} strokeWidth="4" strokeLinejoin="round" />
      {/* belly */}
      <ellipse cx="60" cy="74" rx="14" ry="12" fill="#FFF0A0" stroke="none" />
      <Face cy={66} eyeR={5} mouthY={77} blushX={[42, 78]} />
    </>
  );
}

function MistveilSprite({ sw }: { sw: number }) {
  // Translucent cloak shape, only face visible inside veil
  return (
    <>
      {/* veil outer */}
      <path d="M24 48 C20 28 40 16 60 18 C80 16 100 28 96 48 L88 104 C84 116 36 116 32 104Z"
        fill={C.zephyrSecondary} stroke={C.outline} strokeWidth={sw} opacity=".85" />
      {/* veil ripple hem */}
      <path d="M32 104 C38 110 52 106 60 110 C68 106 82 110 88 104" fill="none" stroke={C.zephyrDark} strokeWidth="3.5" strokeLinecap="round" opacity=".6" />
      {/* inner body glow */}
      <ellipse cx="60" cy="64" rx="18" ry="20" fill="white" opacity=".3" />
      {/* sparkle dots around veil */}
      <circle cx="22" cy="62" r="3" fill={C.zephyrAccent} />
      <circle cx="98" cy="62" r="3" fill={C.zephyrAccent} />
      <circle cx="34" cy="34" r="2.5" fill={C.zephyrAccent} opacity=".8" />
      <circle cx="86" cy="34" r="2.5" fill={C.zephyrAccent} opacity=".8" />
      {/* face — peeking from inside */}
      <circle cx="52" cy="62" r="5.5" fill={C.face} />
      <circle cx="68" cy="62" r="5.5" fill={C.face} />
      <circle cx="53.5" cy="60.5" r="2" fill="white" />
      <circle cx="69.5" cy="60.5" r="2" fill="white" />
      <path d="M52 74 C56 80 64 80 68 74" fill="none" stroke={C.face} strokeWidth="3.5" strokeLinecap="round" />
    </>
  );
}

function TempestriSprite({ sw }: { sw: number }) {
  // Rare: dramatic storm-eye form, swirling body, three orbiting orbs
  return (
    <>
      {/* orbit ring */}
      <circle cx="60" cy="66" r="46" fill="none" stroke="#5030A0" strokeWidth="3" strokeDasharray="6 4" opacity=".5" />
      {/* orbiting orbs */}
      <circle cx="14" cy="50" r="7" fill="#8860E0" stroke={C.outline} strokeWidth="3.5" />
      <circle cx="60" cy="22" r="7" fill={C.zephyrAccent} stroke={C.outline} strokeWidth="3.5" />
      <circle cx="106" cy="50" r="7" fill="#50C0F0" stroke={C.outline} strokeWidth="3.5" />
      {/* swirl body */}
      <circle cx="60" cy="66" r="32" fill="#2A1860" stroke={C.outline} strokeWidth={sw} />
      {/* spiral pattern */}
      <path d="M60 40 C76 44 80 58 72 68 C64 78 50 76 46 66 C42 56 50 46 60 46 C68 46 74 54 72 62"
        fill="none" stroke="#8860E0" strokeWidth="4" strokeLinecap="round" opacity=".8" />
      {/* eye of storm */}
      <circle cx="60" cy="66" r="12" fill="#5030A0" />
      <circle cx="60" cy="66" r="6" fill="#C8A8FF" />
      <circle cx="60" cy="66" r="3" fill="white" />
      {/* lightning arcs */}
      <path d="M30 46 C24 38 18 42 22 50" fill="none" stroke={C.zephyrAccent} strokeWidth="3" strokeLinecap="round" />
      <path d="M90 46 C96 38 102 42 98 50" fill="none" stroke={C.zephyrAccent} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

// ---------------------------------------------------------------------------
// PETS data (used on PetsPage card grid)
// ---------------------------------------------------------------------------

type PetEntry = {
  kind: PetKind;
  name: string;
  stage: string;
  color: string;
  detail: string;
  branch: Branch | 'universal';
};

const PETS: PetEntry[] = [
  { kind: 'nubbin',   name: 'Nubbin',   stage: 'Baby',           color: 'bg-[#FFF4BE]', detail: 'Curious, unformed, full of potential',  branch: 'universal' },
  // Grove
  { kind: 'twiglet',  name: 'Twiglet',  stage: 'Grove Young',    color: 'bg-[#D7F3B9]', detail: 'Sprouts arms from nowhere',              branch: 'grove' },
  { kind: 'pebblur',  name: 'Pebblur',  stage: 'Grove Young',    color: 'bg-[#E4EDC7]', detail: 'Collects smooth stones during naps',     branch: 'grove' },
  { kind: 'thornlet', name: 'Thornlet', stage: 'Grove Young',    color: 'bg-[#C5EAA6]', detail: 'Tiny thorns hide a playful nature',      branch: 'grove' },
  { kind: 'mosswick', name: 'Mosswick', stage: 'Grove Mature',   color: 'bg-[#C8A46A]', detail: 'A calm log that hums quietly',           branch: 'grove' },
  { kind: 'bramblox', name: 'Bramblox', stage: 'Grove Mature',   color: 'bg-[#B5E58D]', detail: 'Rolls through brambles without a scratch', branch: 'grove' },
  { kind: 'fernwing', name: 'Fernwing', stage: 'Grove Mature',   color: 'bg-[#D7F3B9]', detail: 'Glides between canopy layers',           branch: 'grove' },
  { kind: 'gloomoak', name: 'Gloomoak', stage: 'Grove Rare',     color: 'bg-[#2A1F3D]', detail: 'Ancient hollow, gentle haunting glow',   branch: 'grove' },
  // Tide
  { kind: 'blubkin',  name: 'Blubkin',  stage: 'Tide Young',     color: 'bg-[#C4F5FA]', detail: 'Wobbles perfectly in gentle currents',   branch: 'tide' },
  { kind: 'splotch',  name: 'Splotch',  stage: 'Tide Young',     color: 'bg-[#CDEFFF]', detail: 'Makes every current into a new shape',   branch: 'tide' },
  { kind: 'gillby',   name: 'Gillby',   stage: 'Tide Young',     color: 'bg-[#BDECF5]', detail: 'Tests its fins against every ripple',    branch: 'tide' },
  { kind: 'coraloom', name: 'Coraloom', stage: 'Tide Mature',    color: 'bg-[#C4F5FA]', detail: 'Wears a living reef crown with pride',   branch: 'tide' },
  { kind: 'driftmaw', name: 'Driftmaw', stage: 'Tide Mature',    color: 'bg-[#A4E0F8]', detail: 'Wide grin, wider wingspan',              branch: 'tide' },
  { kind: 'inkwhirl', name: 'Inkwhirl', stage: 'Tide Mature',    color: 'bg-[#C9D8FF]', detail: 'Sketches starry spirals through the tide', branch: 'tide' },
  { kind: 'abyssling',name: 'Abyssling',stage: 'Tide Rare',      color: 'bg-[#0A1F3A]', detail: 'Lures others with warm lantern light',   branch: 'tide' },
  // Zephyr
  { kind: 'pufflet',  name: 'Pufflet',  stage: 'Zephyr Young',   color: 'bg-[#D8D3FF]', detail: 'Bounces softly on invisible winds',      branch: 'zephyr' },
  { kind: 'driftoo',  name: 'Driftoo',  stage: 'Zephyr Young',   color: 'bg-[#E7E2FF]', detail: 'Trails ribbons of mist while drifting',  branch: 'zephyr' },
  { kind: 'stormite', name: 'Stormite', stage: 'Zephyr Young',   color: 'bg-[#FFF0A0]', detail: 'Stores a bright charge in its crest',    branch: 'zephyr' },
  { kind: 'cumulus',  name: 'Cumulus',  stage: 'Zephyr Mature',  color: 'bg-[#D8D3FF]', detail: 'Big, soft, and unshakeably calm',        branch: 'zephyr' },
  { kind: 'sparkave', name: 'Sparkave', stage: 'Zephyr Mature',  color: 'bg-[#FFF0A0]', detail: 'Crackles with static during storms',     branch: 'zephyr' },
  { kind: 'mistveil', name: 'Mistveil', stage: 'Zephyr Mature',  color: 'bg-[#E8E4FF]', detail: 'Folds the evening air into a soft cloak', branch: 'zephyr' },
  { kind: 'tempestri',name: 'Tempestri',stage: 'Zephyr Rare',    color: 'bg-[#1A0C40]', detail: 'Storm and stillness at once',            branch: 'zephyr' },
];

// ---------------------------------------------------------------------------
// HABITATS — universal environments, usable by every pet
// ---------------------------------------------------------------------------

type HabitatDef = {
  id: string;
  name: string;
  mood: string;
  skyTop: string;
  skyBottom: string;
  groundColor: string;
  accentColor: string;
};

const HABITATS: HabitatDef[] = [
  {
    id: 'sf-bay',
    name: 'San Francisco Bay Area',
    mood: 'Park grass, bay fog',
    skyTop: '#8BBFE0',
    skyBottom: '#D0E8F4',
    groundColor: '#72B84A',
    accentColor: '#FF6030',
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    mood: 'Pier, waves, Ferris wheel',
    skyTop: '#6EC8F8',
    skyBottom: '#C8ECFF',
    groundColor: '#F0D880',
    accentColor: '#FF6030',
  },
  {
    id: 'japan',
    name: 'Japan',
    mood: 'Countryside, Fuji, petals',
    skyTop: '#C8DCF8',
    skyBottom: '#F0F4FF',
    groundColor: '#90C860',
    accentColor: '#FF4488',
  },
  {
    id: 'beach',
    name: 'Beach',
    mood: 'Breezy and golden',
    skyTop: '#87CEEB',
    skyBottom: '#B0E0FF',
    groundColor: '#F4D47C',
    accentColor: '#FF9944',
  },
  {
    id: 'space',
    name: 'Space',
    mood: 'Vast and mysterious',
    skyTop: '#060820',
    skyBottom: '#0D1A40',
    groundColor: '#1A2255',
    accentColor: '#C8A8FF',
  },
  {
    id: 'launch-pad',
    name: 'Launch Pad',
    mood: 'Tense and thrilling',
    skyTop: '#1A3A6A',
    skyBottom: '#2A5890',
    groundColor: '#808080',
    accentColor: '#FFE347',
  },
  {
    id: 'rocket-interior',
    name: 'Inside a Space Rocket',
    mood: 'Cozy and adventurous',
    skyTop: '#1C1C2E',
    skyBottom: '#2D2D50',
    groundColor: '#3A3A5C',
    accentColor: '#00E8C8',
  },
  {
    id: 'spooky-cemetery',
    name: 'Spooky Cemetery',
    mood: 'Charming and whimsical',
    skyTop: '#2A1A4A',
    skyBottom: '#3D2B6A',
    groundColor: '#3A5C3A',
    accentColor: '#C8A8FF',
  },
  {
    id: 'desert',
    name: 'Desert',
    mood: 'Hot and wide open',
    skyTop: '#FFB347',
    skyBottom: '#FF8C42',
    groundColor: '#E8A44A',
    accentColor: '#FF5D2E',
  },
  {
    id: 'austin',
    name: 'Austin, Texas',
    mood: 'Pennybacker arch, bats at dusk',
    skyTop: '#3A2A10',
    skyBottom: '#FFB84A',
    groundColor: '#6A8840',
    accentColor: '#C85020',
  },
];

// ---------------------------------------------------------------------------
// Habitat scene SVG illustrations — one per habitat, 240×160 viewBox
// Each keeps the center 80×80 region quiet for the pet stage.
// ---------------------------------------------------------------------------

function HabitatScene_SFBay() {
  // Dolores Park grass foreground + Golden Gate Bridge centred in upper background.
  // GGB structural grammar from reference: twin portal-frame towers (two legs each,
  // multiple horizontal portals, X-bracing on lower legs), sweeping catenary cables,
  // dense vertical hangers, trussed road deck. Towers centred x≈80 & x≈162 so both
  // stay comfortably within the 240-wide viewBox at every card width.
  const INTL = '#E8381A'; // International Orange
  const DARK = '#C02010'; // shadow face
  const STRK = '#074F9A'; // Kinotchi outline
  // Tower geometry helpers — left tower legs at lx1,lx2; right tower at rx1,rx2
  const lt1 = 76, lt2 = 83; // left tower leg x centres
  const rt1 = 158, rt2 = 165; // right tower leg x centres
  const tTop = 20;  // tower apex y
  const tBot = 84;  // tower base / deck y
  // Catenary: main cable arcs from tower top to tower top, mid-sag at x=120
  const cableMid = 8; // cable lowest y at mid-span
  const cableY = (x: number) => {
    const half = (rt1 + rt2) / 2 - (lt1 + lt2) / 2; // half-span ~49
    const cx = (lt1 + lt2) / 2; // ~79.5 centre of left tower
    return tTop + Math.pow((x - (cx + half)) / half, 2) * (tTop - cableMid) + (cableMid - tTop);
  };
  const hangers = [90, 98, 106, 114, 122, 130, 138, 146, 154];
  return (
    <svg viewBox="0 0 240 160" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sfsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7AAED8" />
          <stop offset="55%" stopColor="#AED0E8" />
          <stop offset="100%" stopColor="#CCE4F0" />
        </linearGradient>
        <linearGradient id="sfbay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A8AAC" />
          <stop offset="100%" stopColor="#336888" />
        </linearGradient>
        <linearGradient id="sfgrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#72B84A" />
          <stop offset="100%" stopColor="#58A030" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="240" height="160" fill="url(#sfsky)" />

      {/* Marin headlands — low green hills behind bridge */}
      <path d="M0 78 Q35 58 75 70 Q105 62 135 72 Q165 64 200 70 L240 72 L240 90 L0 90Z" fill="#5A8C48" />

      {/* Bay water — sits at deck level */}
      <rect x="0" y="82" width="240" height="20" fill="url(#sfbay)" />
      <path d="M0 85 Q40 81 80 85 Q120 89 160 85 Q200 81 240 85" fill="none" stroke="white" strokeWidth="1.2" opacity="0.3" />

      {/* ═══════════════════════════════════════════════════════
          GOLDEN GATE BRIDGE
          Left tower centred ~x=79.5, right tower centred ~x=161.5
          Both sets of legs are fully within x=68..172 — safe at all widths.
          ═══════════════════════════════════════════════════════ */}

      {/* Approach span — left anchor to left tower base */}
      <rect x="30" y={tBot - 3} width={lt1 - 30} height="6" rx="1" fill={INTL} />
      <rect x="30" y={tBot - 3} width={lt1 - 30} height="6" rx="1" fill="none" stroke={STRK} strokeWidth="1" />
      {/* Approach span — right tower base to right anchor */}
      <rect x={rt2} y={tBot - 3} width={210 - rt2} height="6" rx="1" fill={INTL} />
      <rect x={rt2} y={tBot - 3} width={210 - rt2} height="6" rx="1" fill="none" stroke={STRK} strokeWidth="1" />

      {/* LEFT TOWER — two vertical legs + horizontal portals + X-brace lower */}
      {/* Leg shafts */}
      <rect x={lt1 - 4} y={tTop} width="8" height={tBot - tTop} rx="1.5" fill={INTL} stroke={STRK} strokeWidth="1.5" />
      <rect x={lt2 - 4} y={tTop} width="8" height={tBot - tTop} rx="1.5" fill={INTL} stroke={STRK} strokeWidth="1.5" />
      {/* Shadow face on right leg */}
      <rect x={lt2 - 4} y={tTop} width="8" height={tBot - tTop} rx="1.5" fill={DARK} opacity="0.22" />
      {/* Portal crossbars — 4 horizontal bars */}
      {[tTop + 4, tTop + 18, tTop + 32, tTop + 46].map((y, i) => (
        <rect key={i} x={lt1 - 8} y={y} width={lt2 - lt1 + 16} height="5" rx="1" fill={INTL} stroke={STRK} strokeWidth="1.5" />
      ))}
      {/* Top cap */}
      <rect x={lt1 - 6} y={tTop - 4} width={lt2 - lt1 + 12} height="5" rx="1.5" fill={INTL} stroke={STRK} strokeWidth="1.5" />
      {/* X-brace on lower portal (between bottom two crossbars) */}
      <line x1={lt1 - 4} y1={tTop + 51} x2={lt2 + 4} y2={tTop + 37} stroke={DARK} strokeWidth="2" opacity="0.6" />
      <line x1={lt2 + 4} y1={tTop + 51} x2={lt1 - 4} y2={tTop + 37} stroke={DARK} strokeWidth="2" opacity="0.6" />
      {/* X-brace on lower legs (below bottom crossbar to base) */}
      <line x1={lt1 - 4} y1={tBot} x2={lt2 + 4} y2={tTop + 55} stroke={DARK} strokeWidth="2" opacity="0.5" />
      <line x1={lt2 + 4} y1={tBot} x2={lt1 - 4} y2={tTop + 55} stroke={DARK} strokeWidth="2" opacity="0.5" />

      {/* RIGHT TOWER — same grammar */}
      <rect x={rt1 - 4} y={tTop} width="8" height={tBot - tTop} rx="1.5" fill={INTL} stroke={STRK} strokeWidth="1.5" />
      <rect x={rt2 - 4} y={tTop} width="8" height={tBot - tTop} rx="1.5" fill={INTL} stroke={STRK} strokeWidth="1.5" />
      <rect x={rt2 - 4} y={tTop} width="8" height={tBot - tTop} rx="1.5" fill={DARK} opacity="0.22" />
      {[tTop + 4, tTop + 18, tTop + 32, tTop + 46].map((y, i) => (
        <rect key={i} x={rt1 - 8} y={y} width={rt2 - rt1 + 16} height="5" rx="1" fill={INTL} stroke={STRK} strokeWidth="1.5" />
      ))}
      <rect x={rt1 - 6} y={tTop - 4} width={rt2 - rt1 + 12} height="5" rx="1.5" fill={INTL} stroke={STRK} strokeWidth="1.5" />
      <line x1={rt1 - 4} y1={tTop + 51} x2={rt2 + 4} y2={tTop + 37} stroke={DARK} strokeWidth="2" opacity="0.6" />
      <line x1={rt2 + 4} y1={tTop + 51} x2={rt1 - 4} y2={tTop + 37} stroke={DARK} strokeWidth="2" opacity="0.6" />
      <line x1={rt1 - 4} y1={tBot} x2={rt2 + 4} y2={tTop + 55} stroke={DARK} strokeWidth="2" opacity="0.5" />
      <line x1={rt2 + 4} y1={tBot} x2={rt1 - 4} y2={tTop + 55} stroke={DARK} strokeWidth="2" opacity="0.5" />

      {/* MAIN SUSPENSION CABLES — two parallel catenary paths */}
      {/* Left approach cable */}
      <path d={`M30 ${tBot - 2} Q55 ${tTop + 18} ${(lt1 + lt2) / 2} ${tTop + 2}`}
        fill="none" stroke={INTL} strokeWidth="3" strokeLinecap="round" />
      {/* Main span cable */}
      <path d={`M${(lt1 + lt2) / 2} ${tTop + 2} Q120 ${cableMid} ${(rt1 + rt2) / 2} ${tTop + 2}`}
        fill="none" stroke={INTL} strokeWidth="3" strokeLinecap="round" />
      {/* Right approach cable */}
      <path d={`M${(rt1 + rt2) / 2} ${tTop + 2} Q188 ${tTop + 18} 210 ${tBot - 2}`}
        fill="none" stroke={INTL} strokeWidth="3" strokeLinecap="round" />
      {/* Shadow cable (depth) */}
      <path d={`M${(lt1 + lt2) / 2} ${tTop + 4} Q120 ${cableMid + 2} ${(rt1 + rt2) / 2} ${tTop + 4}`}
        fill="none" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

      {/* VERTICAL HANGER CABLES */}
      {hangers.map((x, i) => {
        const mid = 120;
        const halfSpan = 45;
        const sag = Math.pow((x - mid) / halfSpan, 2) * (tTop - cableMid - 2);
        const top = cableMid + sag;
        return <line key={i} x1={x} y1={top} x2={x} y2={tBot - 3} stroke={INTL} strokeWidth="1.2" opacity="0.8" />;
      })}

      {/* TRUSSED ROAD DECK — thick base + thinner truss line */}
      <rect x="30" y={tBot - 4} width="180" height="7" rx="1" fill={INTL} stroke={STRK} strokeWidth="1.5" />
      <path d="M30 84 L210 84" fill="none" stroke={DARK} strokeWidth="1" opacity="0.35" />

      {/* Animated fog bank — flanks only, never covers bridge centre */}
      <g className="hab-sf-fog" style={{ transformOrigin: '120px 50px', transformBox: 'view-box' }}>
        <ellipse cx="22"  cy="60" rx="36" ry="13" fill="white" opacity="0.20" />
        <ellipse cx="210" cy="55" rx="38" ry="12" fill="white" opacity="0.17" />
        <ellipse cx="118" cy="70" rx="28" ry="8"  fill="white" opacity="0.08" />
      </g>

      {/* Dolores Park grass foreground — the pet stands here on grass */}
      <path d="M0 100 Q60 92 120 100 Q180 108 240 100 L240 160 L0 160Z" fill="url(#sfgrass)" stroke={STRK} strokeWidth="2" />
      {/* Grass texture */}
      <path d="M0 112 Q50 108 100 112 Q150 116 200 112 Q220 110 240 112" fill="none" stroke="#5AAA30" strokeWidth="2" opacity="0.5" />
      {/* Park path diagonal */}
      <path d="M80 160 Q100 130 130 105" fill="none" stroke="#D4C070" strokeWidth="4" strokeLinecap="round" opacity="0.6" />

      {/* Park bench — left side, away from center pet stage */}
      <rect x="10" y="120" width="20" height="3" rx="1.5" fill="#A07840" stroke={STRK} strokeWidth="2" />
      <rect x="12" y="123" width="16" height="2" rx="1" fill="#C09050" stroke={STRK} strokeWidth="1.5" />
      <rect x="12" y="123" width="2" height="8" rx="1" fill="#A07840" stroke={STRK} strokeWidth="1.5" />
      <rect x="26" y="123" width="2" height="8" rx="1" fill="#A07840" stroke={STRK} strokeWidth="1.5" />

      {/* Palm tree — right of scene, Dolores Park has palms */}
      <path d="M214 104 C215 90 213 75 216 62" fill="none" stroke="#8B6020" strokeWidth="5" strokeLinecap="round" />
      <path d="M216 62 C218 52 212 48 208 50" fill="none" stroke="#8B6020" strokeWidth="3.5" strokeLinecap="round" />
      {/* Palm frond crown — spread blades */}
      <path d="M216 62 C204 55 198 48 201 43 C205 46 210 54 216 62Z" fill="#4A9430" stroke="#074F9A" strokeWidth="2" />
      <path d="M216 62 C226 56 232 49 228 44 C224 47 220 55 216 62Z" fill="#5AA840" stroke="#074F9A" strokeWidth="2" />
      <path d="M216 62 C212 50 214 42 220 40 C220 44 218 53 216 62Z" fill="#4A9430" stroke="#074F9A" strokeWidth="2" />
      <path d="M216 62 C220 52 222 44 216 40 C215 45 215 54 216 62Z" fill="#6ABE50" stroke="#074F9A" strokeWidth="2" />
      <path d="M216 62 C208 58 202 54 200 58 C204 59 211 60 216 62Z" fill="#5AA840" stroke="#074F9A" strokeWidth="2" />
      {/* Coconuts */}
      <circle cx="213" cy="63" r="3" fill="#A07820" stroke="#074F9A" strokeWidth="1.5" />
      <circle cx="218" cy="64" r="2.5" fill="#A07820" stroke="#074F9A" strokeWidth="1.5" />

      {/* Kite — upper right, quintessential park activity */}
      <path d="M190 30 L198 22 L204 30 L198 38 Z" fill="#FF6EB4" stroke="#074F9A" strokeWidth="2" />
      <path d="M204 30 L218 42" fill="none" stroke="#074F9A" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7" />
      {/* Kite tail */}
      <path d="M198 38 Q200 44 196 50 Q200 56 196 60" fill="none" stroke="#FFE347" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HabitatScene_LA() {
  // Santa Monica Pier — boardwalk, ocean, Ferris wheel, real slender palm trees
  // Ferris wheel animation: wheel group rotates around its center cx=185 cy=52
  const wheelCx = 185, wheelCy = 52, wheelR = 22;
  const spokeCount = 8;
  const gondolaR = 4;
  return (
    <svg viewBox="0 0 240 160" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="lasky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6EC8F8" />
          <stop offset="55%" stopColor="#A8DCF8" />
          <stop offset="100%" stopColor="#C8ECFF" />
        </linearGradient>
        <linearGradient id="laocean" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2890D0" />
          <stop offset="100%" stopColor="#1868A8" />
        </linearGradient>
        <linearGradient id="laboard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8A068" />
          <stop offset="100%" stopColor="#A88040" />
        </linearGradient>
        <linearGradient id="lasand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0D880" />
          <stop offset="100%" stopColor="#D8B840" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="240" height="160" fill="url(#lasky)" />

      {/* Sun */}
      <circle cx="210" cy="28" r="18" fill="#FFE347" stroke="#074F9A" strokeWidth="2.5" />
      <circle cx="210" cy="28" r="11" fill="#FFF080" />

      {/* Ocean */}
      <rect x="0" y="88" width="240" height="36" fill="url(#laocean)" />
      <path d="M0 90 Q20 86 40 90 Q60 94 80 90 Q100 86 120 90 Q140 94 160 90 Q180 86 200 90 Q220 94 240 90"
        fill="none" stroke="white" strokeWidth="2" opacity="0.5" />

      {/* Santa Monica Pier deck */}
      <rect x="100" y="82" width="140" height="10" rx="2" fill="url(#laboard)" stroke="#074F9A" strokeWidth="2.5" />
      {/* Pier pylons beneath */}
      {[110,124,138,152,166,180,194,208,222].map((x,i) => (
        <rect key={i} x={x-2} y={92} width="4" height="20" rx="2" fill="#A07830" stroke="#074F9A" strokeWidth="1.5" />
      ))}
      {/* Pier guardrail posts */}
      {[106,120,134,148,162,176,190,204,218,232].map((x,i) => (
        <rect key={i} x={x-1} y={76} width="2" height="8" fill="#A07830" stroke="#074F9A" strokeWidth="1" />
      ))}
      <line x1="106" y1="78" x2="234" y2="78" stroke="#A07830" strokeWidth="1.5" />

      {/* Ferris wheel — animates as one rotating group */}
      {/* Static support legs */}
      <line x1={wheelCx - 16} y1={wheelCy + wheelR} x2={wheelCx - 16} y2={92}
        stroke="#074F9A" strokeWidth="3" strokeLinecap="round" />
      <line x1={wheelCx + 16} y1={wheelCy + wheelR} x2={wheelCx + 16} y2={92}
        stroke="#074F9A" strokeWidth="3" strokeLinecap="round" />
      <line x1={wheelCx - 16} y1={88} x2={wheelCx + 16} y2={88}
        stroke="#074F9A" strokeWidth="2.5" />
      {/* Rotating wheel group */}
      <g className="hab-la-wheel"
        style={{ transformOrigin: `${wheelCx}px ${wheelCy}px`, transformBox: 'view-box' }}>
        {/* Outer ring */}
        <circle cx={wheelCx} cy={wheelCy} r={wheelR} fill="none" stroke="#FF6030" strokeWidth="3" />
        <circle cx={wheelCx} cy={wheelCy} r={wheelR - 6} fill="none" stroke="#FF6030" strokeWidth="1.5" opacity="0.5" />
        {/* Spokes + gondolas */}
        {Array.from({ length: spokeCount }).map((_, i) => {
          const angle = (i / spokeCount) * Math.PI * 2;
          const gx = wheelCx + Math.cos(angle) * wheelR;
          const gy = wheelCy + Math.sin(angle) * wheelR;
          const colors = ['#FF6EB4','#FFE347','#83DFF0','#73C95D','#FF6EB4','#FFE347','#83DFF0','#73C95D'];
          return (
            <g key={i}>
              <line x1={wheelCx} y1={wheelCy} x2={gx} y2={gy}
                stroke="#074F9A" strokeWidth="1.5" opacity="0.7" />
              <circle cx={gx} cy={gy} r={gondolaR} fill={colors[i]} stroke="#074F9A" strokeWidth="1.5" />
            </g>
          );
        })}
        {/* Hub */}
        <circle cx={wheelCx} cy={wheelCy} r="5" fill="#FFE347" stroke="#074F9A" strokeWidth="2" />
      </g>

      {/* Boardwalk building / arcade — right of wheel */}
      <rect x="215" y="70" width="25" height="22" rx="3" fill="#FF9944" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="220" y="62" width="16" height="10" rx="2" fill="#FF7722" stroke="#074F9A" strokeWidth="2" />
      <path d="M217 70 L223 64 L237 70Z" fill="#CC4400" stroke="#074F9A" strokeWidth="2" />

      {/* Sand beach in foreground */}
      <path d="M0 112 Q40 108 80 112 Q120 116 160 112 Q200 108 240 112 L240 160 L0 160Z" fill="url(#lasand)" stroke="#074F9A" strokeWidth="2" />

      {/* Palm tree — left, slender curved trunk + frond crown */}
      {/* Trunk: single curved path = realistic slender palm */}
      <path d="M18 130 C20 112 22 95 26 78 C28 68 30 60 28 52" fill="none" stroke="#8B5A18" strokeWidth="5" strokeLinecap="round" />
      {/* Frond crown — individual blade fronds radiating from top */}
      <path d="M28 52 C18 44 10 40 8 44 C12 46 20 50 28 52Z" fill="#40901A" stroke="#074F9A" strokeWidth="2" />
      <path d="M28 52 C38 44 46 40 47 44 C43 47 36 50 28 52Z" fill="#50A828" stroke="#074F9A" strokeWidth="2" />
      <path d="M28 52 C24 40 24 32 30 30 C30 34 29 44 28 52Z" fill="#40901A" stroke="#074F9A" strokeWidth="2" />
      <path d="M28 52 C34 42 36 34 32 30 C31 35 30 44 28 52Z" fill="#60C038" stroke="#074F9A" strokeWidth="2" />
      <path d="M28 52 C20 46 14 44 12 48 C16 49 22 51 28 52Z" fill="#50A828" stroke="#074F9A" strokeWidth="2" />
      {/* Coconut nuts */}
      <circle cx="27" cy="53" r="3.5" fill="#906020" stroke="#074F9A" strokeWidth="1.5" />
      <circle cx="31" cy="54" r="3" fill="#906020" stroke="#074F9A" strokeWidth="1.5" />

      {/* Palm tree — far right, taller */}
      <path d="M228 132 C226 112 224 96 222 80 C220 68 218 58 220 48" fill="none" stroke="#8B5A18" strokeWidth="5" strokeLinecap="round" />
      <path d="M220 48 C210 40 202 36 200 40 C204 43 213 46 220 48Z" fill="#40901A" stroke="#074F9A" strokeWidth="2" />
      <path d="M220 48 C230 40 238 37 239 42 C235 44 228 47 220 48Z" fill="#50A828" stroke="#074F9A" strokeWidth="2" />
      <path d="M220 48 C216 36 218 28 224 26 C223 32 222 41 220 48Z" fill="#60C038" stroke="#074F9A" strokeWidth="2" />
      <path d="M220 48 C226 38 228 30 224 28 C222 34 221 42 220 48Z" fill="#40901A" stroke="#074F9A" strokeWidth="2" />
      <path d="M220 48 C212 44 206 44 205 48 C209 49 215 49 220 48Z" fill="#50A828" stroke="#074F9A" strokeWidth="2" />

      {/* Left palm, second one slightly further in */}
      <path d="M50 136 C52 118 54 102 58 86 C60 76 64 66 62 56" fill="none" stroke="#8B5A18" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M62 56 C52 48 44 44 42 48 C46 51 55 54 62 56Z" fill="#50A828" stroke="#074F9A" strokeWidth="2" />
      <path d="M62 56 C72 48 78 45 79 50 C75 52 68 54 62 56Z" fill="#40901A" stroke="#074F9A" strokeWidth="2" />
      <path d="M62 56 C58 44 60 36 66 34 C65 40 64 49 62 56Z" fill="#60C038" stroke="#074F9A" strokeWidth="2" />
    </svg>
  );
}

function HabitatScene_Japan() {
  // Rural Japanese countryside: rice fields in foreground, rolling green hills, Mt Fuji in background
  // Fuji = colored body (blue-grey) + distinct white snow cap
  // Drifting cherry-blossom petals are the environmental animation
  return (
    <svg viewBox="0 0 240 160" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="jpsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8DCF8" />
          <stop offset="40%" stopColor="#E0ECFF" />
          <stop offset="100%" stopColor="#F0F4FF" />
        </linearGradient>
        {/* Fuji mountain body — pale blue-grey */}
        <linearGradient id="jpfuji" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8090B0" />
          <stop offset="60%" stopColor="#A0B0C8" />
          <stop offset="100%" stopColor="#B8C8D8" />
        </linearGradient>
        <linearGradient id="jpfield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#90C860" />
          <stop offset="100%" stopColor="#68A840" />
        </linearGradient>
        <linearGradient id="jprice" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B8D870" />
          <stop offset="100%" stopColor="#98C050" />
        </linearGradient>
      </defs>

      {/* Sky — pale morning blue */}
      <rect width="240" height="160" fill="url(#jpsky)" />

      {/* Nihon sun disc — top centre, unmistakable */}
      <circle cx="120" cy="24" r="16" fill="#CC1100" stroke="#074F9A" strokeWidth="2" opacity="0.9" />

      {/* Mt Fuji — distant, centred, colored body + white cap */}
      {/* Mountain body */}
      <path d="M60 106 L118 28 L176 106Z" fill="url(#jpfuji)" stroke="#074F9A" strokeWidth="3" />
      {/* Left shadow face slightly darker */}
      <path d="M60 106 L118 28 L118 106Z" fill="#6878A0" opacity="0.25" />
      {/* Snow cap — clearly white, separate shape sitting on top of the blue body */}
      <path d="M100 58 L118 28 L136 58 Q128 68 118 64 Q108 68 100 58Z"
        fill="#F4F8FF" stroke="#074F9A" strokeWidth="2.5" />
      {/* Snow cap shading — subtle blue-grey in recessed areas */}
      <path d="M103 60 L118 36 L118 64 Q110 66 103 60Z" fill="#C0CCD8" opacity="0.35" />

      {/* Rolling green hills in middle distance */}
      <path d="M0 100 Q30 80 70 92 Q100 82 130 96 Q160 86 200 92 Q220 88 240 92 L240 108 L0 108Z"
        fill="#78B850" stroke="#074F9A" strokeWidth="2" />
      <path d="M0 106 Q40 96 80 104 Q120 112 160 104 Q200 96 240 106 L240 115 L0 115Z"
        fill="#8AC860" stroke="none" opacity="0.6" />

      {/* Rice / tea field terraces — characteristic Japanese countryside */}
      <path d="M0 115 L240 115 L240 160 L0 160Z" fill="url(#jpfield)" />
      {/* Terrace bands */}
      <path d="M0 125 Q60 122 120 125 Q180 128 240 125" fill="none" stroke="#70A840" strokeWidth="2.5" opacity="0.7" />
      <path d="M0 135 Q60 132 120 135 Q180 138 240 135" fill="none" stroke="#70A840" strokeWidth="2.5" opacity="0.7" />
      <path d="M0 145 Q60 142 120 145 Q180 148 240 145" fill="none" stroke="#70A840" strokeWidth="2" opacity="0.5" />
      {/* Rice field water reflections */}
      <rect x="8"   y="118" width="40" height="8" rx="2" fill="url(#jprice)" opacity="0.8" />
      <rect x="60"  y="120" width="50" height="7" rx="2" fill="url(#jprice)" opacity="0.7" />
      <rect x="130" y="118" width="42" height="8" rx="2" fill="url(#jprice)" opacity="0.75" />
      <rect x="190" y="120" width="44" height="7" rx="2" fill="url(#jprice)" opacity="0.7" />
      {/* Field path */}
      <path d="M102 160 L108 115" fill="none" stroke="#C8A840" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />

      {/* Cherry blossom tree — left foreground.
           Trunk cx≈33. Canopy: main circle cx=33 r=13, left sub cx=22 r=9, right sub cx=44 r=10.
           Leftmost stroke edge: 22−9−1=12 ≥ 10. Safe at all widths.            */}
      <rect x="30" y="96" width="6" height="24" rx="3" fill="#7A4820" stroke="#074F9A" strokeWidth="2" />
      <circle cx="33" cy="88" r="13" fill="#FF8CB4" stroke="#074F9A" strokeWidth="2.5" />
      <circle cx="22" cy="93" r="9"  fill="#FFA0C4" stroke="#074F9A" strokeWidth="2" />
      <circle cx="44" cy="91" r="10" fill="#FFB4D0" stroke="#074F9A" strokeWidth="2" />

      {/* Torii gate — right foreground, inset so both posts fully visible */}
      {/* Left post x=196, right post x=215 — both clear of 240 edge */}
      <rect x="196" y="80" width="7" height="36" rx="2" fill="#CC2200" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="214" y="80" width="7" height="36" rx="2" fill="#CC2200" stroke="#074F9A" strokeWidth="2.5" />
      {/* Top curved kasagi beam */}
      <path d="M191 76 Q210 70 228 76" fill="none" stroke="#CC2200" strokeWidth="7" strokeLinecap="round" />
      <path d="M191 76 Q210 70 228 76" fill="none" stroke="#074F9A" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* Nuki (second crossbar) */}
      <rect x="193" y="88" width="31" height="4" rx="2" fill="#CC2200" stroke="#074F9A" strokeWidth="2" />

      {/* Animated drifting petals — upper half of scene, away from pet bottom-centre */}
      <g className="hab-jp-petal-a" style={{ transformOrigin: '78px 62px', transformBox: 'view-box' }}>
        <ellipse cx="78" cy="62" rx="5" ry="3" fill="#FF88B4" stroke="#074F9A" strokeWidth="1.5" transform="rotate(-20 78 62)" opacity="0.88" />
      </g>
      <g className="hab-jp-petal-b" style={{ transformOrigin: '55px 50px', transformBox: 'view-box' }}>
        <ellipse cx="55" cy="50" rx="4.5" ry="2.8" fill="#FFB0D0" stroke="#074F9A" strokeWidth="1.2" transform="rotate(15 55 50)" opacity="0.82" />
      </g>
      <g className="hab-jp-petal-c" style={{ transformOrigin: '170px 45px', transformBox: 'view-box' }}>
        <ellipse cx="170" cy="45" rx="4" ry="2.5" fill="#FF9EC8" stroke="#074F9A" strokeWidth="1.2" transform="rotate(30 170 45)" opacity="0.78" />
      </g>
      {/* Static additional petals for richness */}
      <ellipse cx="148" cy="58" rx="4" ry="2.5" fill="#FF88B4" stroke="#074F9A" strokeWidth="1.2" transform="rotate(-10 148 58)" opacity="0.7" />
      <ellipse cx="36" cy="74" rx="3.5" ry="2" fill="#FFB0D0" stroke="#074F9A" strokeWidth="1" transform="rotate(25 36 74)" opacity="0.65" />
    </svg>
  );
}

function HabitatScene_Beach() {
  return (
    <svg viewBox="0 0 240 160" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="beachsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5BB8F5" />
          <stop offset="100%" stopColor="#A8DCF8" />
        </linearGradient>
        <linearGradient id="beachwater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3BB0E0" />
          <stop offset="100%" stopColor="#2890C0" />
        </linearGradient>
        <linearGradient id="beachsand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4D47C" />
          <stop offset="100%" stopColor="#DEB850" />
        </linearGradient>
      </defs>
      <rect width="240" height="160" fill="url(#beachsky)" />
      {/* Sun */}
      <circle cx="190" cy="30" r="20" fill="#FFE347" stroke="#074F9A" strokeWidth="2.5" />
      <circle cx="190" cy="30" r="13" fill="#FFEF90" />
      {/* Clouds */}
      <ellipse cx="50" cy="40" rx="30" ry="12" fill="white" stroke="#074F9A" strokeWidth="2" opacity="0.9" />
      <ellipse cx="35" cy="44" rx="20" ry="10" fill="white" stroke="#074F9A" strokeWidth="2" opacity="0.9" />
      <ellipse cx="68" cy="44" rx="22" ry="10" fill="white" stroke="#074F9A" strokeWidth="2" opacity="0.9" />
      {/* Ocean */}
      <rect x="0" y="88" width="240" height="30" fill="url(#beachwater)" />
      {/* Wave crests — front wave animates */}
      <g className="hab-beach-wave" style={{ transformOrigin: '120px 90px', transformBox: 'view-box' }}>
        <path d="M0 90 Q20 84 40 90 Q60 96 80 90 Q100 84 120 90 Q140 96 160 90 Q180 84 200 90 Q220 96 240 90" fill="none" stroke="white" strokeWidth="2.5" opacity="0.7" />
      </g>
      <path d="M0 96 Q30 92 60 96 Q90 100 120 96 Q150 92 180 96 Q210 100 240 96" fill="none" stroke="white" strokeWidth="1.8" opacity="0.5" />
      {/* Sand */}
      <path d="M0 112 Q40 106 80 112 Q120 118 160 112 Q200 106 240 112 L240 160 L0 160Z" fill="url(#beachsand)" stroke="#074F9A" strokeWidth="2" />
      {/* Beach umbrella — left */}
      <rect x="28" y="100" width="4" height="46" rx="2" fill="#8B6830" stroke="#074F9A" strokeWidth="2" />
      <path d="M8 102 Q30 84 52 102Z" fill="#FF6EB4" stroke="#074F9A" strokeWidth="2.5" />
      <path d="M14 100 Q30 90 46 100Z" fill="#FF9944" stroke="#074F9A" strokeWidth="2" opacity="0.8" />
      {/* Shells on beach */}
      <ellipse cx="70" cy="135" rx="7" ry="4" fill="#FFB8B8" stroke="#074F9A" strokeWidth="2" />
      <ellipse cx="85" cy="142" rx="5" ry="3" fill="#FFD0A0" stroke="#074F9A" strokeWidth="2" />
      {/* Crab (cute!) */}
      <ellipse cx="185" cy="138" rx="10" ry="7" fill="#FF7744" stroke="#074F9A" strokeWidth="2.5" />
      <circle cx="181" cy="135" r="2.5" fill="#074F9A" />
      <circle cx="189" cy="135" r="2.5" fill="#074F9A" />
      <path d="M177 136 C172 130 168 128 167 132" fill="none" stroke="#FF7744" strokeWidth="3" strokeLinecap="round" />
      <path d="M193 136 C198 130 202 128 203 132" fill="none" stroke="#FF7744" strokeWidth="3" strokeLinecap="round" />
      <path d="M175 140 C170 144 168 147 170 149" fill="none" stroke="#FF7744" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M195 140 C200 144 202 147 200 149" fill="none" stroke="#FF7744" strokeWidth="2.5" strokeLinecap="round" />
      {/* Sandcastle */}
      <rect x="210" y="126" width="22" height="20" rx="3" fill="#E8C870" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="207" y="118" width="8" height="12" rx="2" fill="#E8C870" stroke="#074F9A" strokeWidth="2" />
      <rect x="225" y="118" width="8" height="12" rx="2" fill="#E8C870" stroke="#074F9A" strokeWidth="2" />
      <path d="M207 118 L211 112 L215 118Z" fill="#D4AA50" stroke="#074F9A" strokeWidth="2" />
      <path d="M225 118 L229 112 L233 118Z" fill="#D4AA50" stroke="#074F9A" strokeWidth="2" />
    </svg>
  );
}

function HabitatScene_Space() {
  return (
    <svg viewBox="0 0 240 160" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="spacesky" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#1A2878" />
          <stop offset="100%" stopColor="#020510" />
        </radialGradient>
        <radialGradient id="planet1" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#B890FF" />
          <stop offset="100%" stopColor="#6030C0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#spacesky)" />
      {/* Stars — three receive twinkling animation classes, rest are static */}
      {[[14,12],[28,38],[48,8],[72,22],[90,45],[112,14],[135,30],[158,10],[175,48],[198,22],[218,38],[232,15],
        [8,60],[42,72],[70,85],[88,60],[130,78],[160,65],[200,80],[225,60]].map(([x,y],i) => {
        const twinkleClass = i === 3 ? 'hab-space-twinkle-a' : i === 8 ? 'hab-space-twinkle-b' : i === 14 ? 'hab-space-twinkle-c' : '';
        return <circle key={i} cx={x} cy={y} r={i%3===0?2:1.2} fill="white" opacity={0.7+0.3*(i%2)} className={twinkleClass || undefined} />;
      })}
      {/* Milky way sweep */}
      <path d="M0 30 Q80 15 160 35 Q200 42 240 28" fill="none" stroke="white" strokeWidth="18" opacity="0.05" />
      {/* Large ringed planet — left */}
      <ellipse cx="55" cy="62" rx="44" ry="12" fill="none" stroke="#C890E8" strokeWidth="4" opacity="0.7" />
      <ellipse cx="55" cy="62" rx="44" ry="12" fill="none" stroke="#074F9A" strokeWidth="6" opacity="0.4" />
      <circle cx="55" cy="62" r="28" fill="url(#planet1)" stroke="#074F9A" strokeWidth="3" />
      <ellipse cx="55" cy="62" rx="28" ry="7" fill="none" stroke="#E0C0FF" strokeWidth="2.5" opacity="0.5" />
      {/* Planet surface bands */}
      <ellipse cx="55" cy="58" rx="24" ry="5" fill="#9060D0" opacity="0.4" />
      <ellipse cx="55" cy="66" rx="22" ry="4" fill="#D0A8FF" opacity="0.3" />
      {/* Ring segments front and back */}
      <path d="M15 66 Q20 68 40 67" fill="none" stroke="#C890E8" strokeWidth="4" opacity="0.6" />
      <path d="M70 64 Q90 62 95 66" fill="none" stroke="#C890E8" strokeWidth="4" opacity="0.6" />
      {/* Moon — small, upper right */}
      <circle cx="195" cy="30" r="16" fill="#D8D0C0" stroke="#074F9A" strokeWidth="2.5" />
      <circle cx="188" cy="26" r="5" fill="#C0B8A8" />
      <circle cx="200" cy="34" r="3.5" fill="#C0B8A8" />
      <circle cx="191" cy="37" r="2.5" fill="#C0B8A8" />
      {/* Asteroid belt — thin strip */}
      {[[120,105],[135,98],[148,108],[162,100],[176,110],[190,102],[204,107]].map(([x,y],i) => (
        <ellipse key={i} cx={x} cy={y} rx={3+i%3} ry={2+i%2} fill="#A09080" stroke="#074F9A" strokeWidth="1.5" transform={`rotate(${i*25} ${x} ${y})`} />
      ))}
      {/* Comet */}
      <ellipse cx="185" cy="70" rx="6" ry="4" fill="white" opacity="0.95" />
      <path d="M179 72 Q160 76 145 80" fill="none" stroke="white" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
      <path d="M179 70 Q162 68 148 65" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      {/* Ground surface (alien rock) */}
      <path d="M0 130 Q40 120 80 128 Q120 136 160 126 Q200 118 240 128 L240 160 L0 160Z" fill="#1A2255" stroke="#074F9A" strokeWidth="2.5" />
      <ellipse cx="40" cy="132" rx="15" ry="6" fill="#0E1640" stroke="#074F9A" strokeWidth="2" />
      <ellipse cx="195" cy="130" rx="12" ry="5" fill="#0E1640" stroke="#074F9A" strokeWidth="2" />
    </svg>
  );
}

function HabitatScene_LaunchPad() {
  return (
    <svg viewBox="0 0 240 160" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="lpsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A1F4A" />
          <stop offset="100%" stopColor="#1A4080" />
        </linearGradient>
        <linearGradient id="lpground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#888888" />
          <stop offset="100%" stopColor="#606060" />
        </linearGradient>
        <radialGradient id="thrustglow" cx="50%" cy="100%" r="50%">
          <stop offset="0%" stopColor="#FF8800" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF4400" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#lpsky)" />
      {/* Stars */}
      {[[15,12],[35,25],[55,10],[75,30],[95,16],[115,28],[155,12],[175,22],[195,8],[215,30],[232,18]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={1.5} fill="white" opacity="0.7" />
      ))}
      {/* Rocket — left, tall and proud */}
      {/* Rocket body */}
      <rect x="28" y="38" width="28" height="68" rx="6" fill="#E0E8F0" stroke="#074F9A" strokeWidth="3.5" />
      {/* Nose cone */}
      <path d="M28 38 Q42 10 56 38Z" fill="#FF4444" stroke="#074F9A" strokeWidth="3.5" />
      {/* Body stripes */}
      <rect x="28" y="70" width="28" height="8" rx="2" fill="#CC0000" stroke="#074F9A" strokeWidth="2" opacity="0.8" />
      {/* Window */}
      <circle cx="42" cy="60" r="7" fill="#A8E8FF" stroke="#074F9A" strokeWidth="2.5" />
      <circle cx="42" cy="60" r="4" fill="#CFFFFF" opacity="0.7" />
      {/* Fins */}
      <path d="M28 100 L16 118 L28 112Z" fill="#CC0000" stroke="#074F9A" strokeWidth="2.5" />
      <path d="M56 100 L68 118 L56 112Z" fill="#CC0000" stroke="#074F9A" strokeWidth="2.5" />
      {/* Thrust exhaust */}
      <path d="M32 106 Q42 120 52 106" fill="#FF8800" stroke="#074F9A" strokeWidth="2" opacity="0.9" />
      <ellipse cx="42" cy="116" rx="14" ry="10" fill="url(#thrustglow)" opacity="0.85" />
      <ellipse cx="42" cy="122" rx="8" ry="6" fill="#FFE347" opacity="0.6" />
      {/* Animated launch smoke plumes — billow upward from base, left of scene */}
      <g className="hab-launch-smoke-a" style={{ transformOrigin: '34px 106px', transformBox: 'view-box' }}>
        <ellipse cx="34" cy="106" rx="9" ry="7" fill="#C0C0C0" opacity="0.55" />
      </g>
      <g className="hab-launch-smoke-b" style={{ transformOrigin: '42px 108px', transformBox: 'view-box' }}>
        <ellipse cx="42" cy="108" rx="11" ry="8" fill="#D0D0D0" opacity="0.45" />
      </g>
      <g className="hab-launch-smoke-c" style={{ transformOrigin: '50px 106px', transformBox: 'view-box' }}>
        <ellipse cx="50" cy="106" rx="8" ry="6" fill="#B8B8B8" opacity="0.50" />
      </g>
      {/* Launch platform / gantry */}
      <rect x="14" y="108" width="56" height="8" rx="3" fill="#707070" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="0" y="112" width="84" height="48" rx="3" fill="url(#lpground)" />
      {/* Ground markings */}
      <circle cx="42" cy="140" r="16" fill="none" stroke="#FFE347" strokeWidth="2.5" strokeDasharray="6 4" />
      <circle cx="42" cy="140" r="8" fill="none" stroke="#FFE347" strokeWidth="2" />
      {/* Gantry arm */}
      <rect x="56" y="42" width="20" height="6" rx="3" fill="#808080" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="72" y="28" width="6" height="20" rx="3" fill="#808080" stroke="#074F9A" strokeWidth="2.5" />
      {/* Control tower — right */}
      <rect x="185" y="50" width="40" height="78" rx="4" fill="#A0A8B8" stroke="#074F9A" strokeWidth="3" />
      <rect x="185" y="46" width="40" height="12" rx="4" fill="#8090A8" stroke="#074F9A" strokeWidth="2.5" />
      {/* Tower windows */}
      {[[192,60],[212,60],[192,76],[212,76],[192,92],[212,92]].map(([wx,wy],i) => (
        <rect key={i} x={wx} y={wy} width="10" height="8" rx="2" fill="#A8E8FF" stroke="#074F9A" strokeWidth="2" />
      ))}
      {/* Antenna */}
      <line x1="205" y1="46" x2="205" y2="28" stroke="#074F9A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="205" cy="26" r="4" fill="#FF4444" stroke="#074F9A" strokeWidth="2" />
      {/* Ground tarmac */}
      <rect x="84" y="120" width="156" height="40" fill="#686868" />
      <rect x="84" y="128" width="156" height="3" fill="#FFE347" opacity="0.7" />
    </svg>
  );
}

function HabitatScene_RocketInterior() {
  return (
    <svg viewBox="0 0 240 160" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="rocketbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A1A30" />
          <stop offset="100%" stopColor="#2A2A50" />
        </linearGradient>
        <linearGradient id="panelbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A3050" />
          <stop offset="100%" stopColor="#1A2040" />
        </linearGradient>
        <radialGradient id="portholeglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="60%" stopColor="#4090C8" />
          <stop offset="100%" stopColor="#0A4080" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#rocketbg)" />
      {/* Curved interior walls — rocket shape */}
      <path d="M20 0 Q0 80 20 160 L220 160 Q240 80 220 0Z" fill="#232840" stroke="#074F9A" strokeWidth="4" />
      {/* Ribbed structure rings */}
      {[28,56,84,112].map((y,i) => (
        <path key={i} d={`M22 ${y} Q120 ${y-4} 218 ${y}`} fill="none" stroke="#3A4A70" strokeWidth="4" />
      ))}
      {/* Floor grating */}
      <rect x="20" y="130" width="200" height="30" rx="4" fill="#1E2A48" stroke="#074F9A" strokeWidth="2.5" />
      {[[40,140],[60,140],[80,140],[100,140],[120,140],[140,140],[160,140],[180,140],[200,140]].map(([x,y],i) => (
        <line key={i} x1={x} y1={130} x2={x} y2={160} stroke="#2A3A60" strokeWidth="2" />
      ))}
      {/* Porthole window — large, left */}
      <circle cx="48" cy="72" r="32" fill="#0A2040" stroke="#074F9A" strokeWidth="4" />
      <circle cx="48" cy="72" r="26" fill="url(#portholeglow)" stroke="#074F9A" strokeWidth="2.5" />
      {/* Stars through porthole */}
      {[[38,62],[52,58],[44,78],[60,68],[40,82],[56,80]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={1.5} fill="white" opacity="0.9" />
      ))}
      <circle cx="48" cy="72" r="26" fill="none" stroke="white" strokeWidth="1.5" opacity="0.2" />
      {/* Porthole bolts */}
      {[0,90,180,270].map((deg,i) => (
        <circle key={i} cx={48 + Math.cos(deg*Math.PI/180)*32} cy={72 + Math.sin(deg*Math.PI/180)*32} r="4" fill="#4A5A80" stroke="#074F9A" strokeWidth="2" />
      ))}
      {/* Control panel — right side */}
      <rect x="155" y="30" width="68" height="90" rx="6" fill="url(#panelbg)" stroke="#074F9A" strokeWidth="3" />
      {/* Panel header */}
      <rect x="160" y="35" width="58" height="12" rx="3" fill="#00E8C8" opacity="0.25" />
      <text x="189" y="44" fontSize="5" fontWeight="900" fill="#00E8C8" textAnchor="middle" fontFamily="monospace" opacity="0.9">MISSION CTRL</text>
      {/* Buttons row 1 — three blink with staggered animation classes */}
      <circle cx={165} cy={54} r="6" fill="#FF4444" stroke="#074F9A" strokeWidth="2" className="hab-rocket-blink-a" />
      <circle cx={180} cy={54} r="6" fill="#FFE347" stroke="#074F9A" strokeWidth="2" className="hab-rocket-blink-b" />
      <circle cx={195} cy={54} r="6" fill="#00E8C8" stroke="#074F9A" strokeWidth="2" className="hab-rocket-blink-c" />
      <circle cx={210} cy={54} r="6" fill="#C8A8FF" stroke="#074F9A" strokeWidth="2" />
      {/* Buttons row 2 */}
      {[[165,72],[180,72],[195,72],[210,72]].map(([bx,by],i) => (
        <rect key={i} x={bx-5} y={by-4} width="10" height="8" rx="2" fill={['#C8A8FF','#FF4444','#FFE347','#00E8C8'][i]} stroke="#074F9A" strokeWidth="2" />
      ))}
      {/* Screen/readout */}
      <rect x="160" y="84" width="58" height="30" rx="4" fill="#001818" stroke="#00E8C8" strokeWidth="2" />
      <text x="189" y="96" fontSize="4.5" fill="#00E8C8" textAnchor="middle" fontFamily="monospace">VELOCITY: 7.8 KM/S</text>
      <text x="189" y="104" fontSize="4.5" fill="#00E8C8" textAnchor="middle" fontFamily="monospace">ALT: 342 KM</text>
      <text x="189" y="112" fontSize="4.5" fill="#FFE347" textAnchor="middle" fontFamily="monospace">STATUS: OK</text>
      {/* Seat straps */}
      <path d="M90 130 L90 100 Q100 92 110 100 L110 130" fill="none" stroke="#C8A050" strokeWidth="4" strokeLinecap="round" />
      <path d="M100 105 L100 130" fill="none" stroke="#C8A050" strokeWidth="3" />
      {/* Ambient glow strips on walls */}
      <rect x="22" y="20" width="6" height="100" rx="3" fill="#00E8C8" opacity="0.15" />
      <rect x="212" y="20" width="6" height="100" rx="3" fill="#00E8C8" opacity="0.15" />
    </svg>
  );
}

function HabitatScene_SpookyCemetery() {
  return (
    <svg viewBox="0 0 240 160" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="spookysky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A0E30" />
          <stop offset="100%" stopColor="#3A2260" />
        </linearGradient>
        <linearGradient id="spookyground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A4A28" />
          <stop offset="100%" stopColor="#183018" />
        </linearGradient>
        <radialGradient id="moonhalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8E0C8" />
          <stop offset="70%" stopColor="#D0C8A0" />
          <stop offset="100%" stopColor="#B0A880" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#spookysky)" />
      {/* Stars */}
      {[[18,15],[40,8],[62,22],[88,12],[115,20],[140,8],[168,18],[192,10],[218,22],[228,38]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={1.5+i%2*0.5} fill="#E0D8C8" opacity="0.8" />
      ))}
      {/* Full moon — soft glow */}
      <circle cx="185" cy="36" r="28" fill="#D0C090" opacity="0.25" />
      <circle cx="185" cy="36" r="22" fill="url(#moonhalo)" stroke="#074F9A" strokeWidth="2.5" />
      {/* Moon face craters */}
      <circle cx="179" cy="30" r="4" fill="#C0B880" opacity="0.6" />
      <circle cx="190" cy="40" r="3" fill="#C0B880" opacity="0.5" />
      <circle cx="182" cy="42" r="2" fill="#C0B880" opacity="0.5" />
      {/* Twisted bare tree — left bg */}
      <path d="M4 110 C8 88 6 70 12 58 C16 48 10 40 14 30" fill="none" stroke="#2A1A48" strokeWidth="6" strokeLinecap="round" />
      <path d="M14 30 C18 20 26 18 28 26" fill="none" stroke="#2A1A48" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 50 C8 42 4 38 6 32" fill="none" stroke="#2A1A48" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M12 66 C6 60 2 58 4 52" fill="none" stroke="#2A1A48" strokeWidth="3" strokeLinecap="round" />

      {/* Ground */}
      <path d="M0 110 Q40 104 80 110 Q120 116 160 110 Q200 104 240 110 L240 160 L0 160Z" fill="url(#spookyground)" stroke="#074F9A" strokeWidth="2.5" />

      {/* ── Tombstones — unmistakable shapes grounded in the grass ── */}

      {/* Stone A — rounded headstone, far left */}
      <rect x="14" y="95" width="22" height="20" rx="0" fill="#8878A8" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="14" y="84" width="22" height="16" rx="11" fill="#8878A8" stroke="#074F9A" strokeWidth="2.5" />
      {/* base slab */}
      <rect x="10" y="113" width="30" height="4" rx="1" fill="#7060A0" stroke="#074F9A" strokeWidth="2" />
      {/* RIP inscription */}
      <text x="25" y="107" fontSize="5.5" fontWeight="900" fill="#074F9A" textAnchor="middle" fontFamily="monospace" opacity="0.8">RIP</text>
      <path d="M18 111 Q25 108 32 111" fill="none" stroke="#074F9A" strokeWidth="1.5" opacity="0.6" />

      {/* Stone B — Latin cross marker */}
      <rect x="68" y="93" width="18" height="22" rx="2" fill="#9888B8" stroke="#074F9A" strokeWidth="2.5" />
      {/* Cross vertical arm */}
      <rect x="73" y="78" width="8" height="20" rx="2" fill="#9888B8" stroke="#074F9A" strokeWidth="2.5" />
      {/* Cross horizontal arm */}
      <rect x="66" y="83" width="22" height="7" rx="2" fill="#9888B8" stroke="#074F9A" strokeWidth="2.5" />
      {/* base slab */}
      <rect x="64" y="113" width="26" height="4" rx="1" fill="#7868A8" stroke="#074F9A" strokeWidth="2" />

      {/* Stone C — large arched memorial, centre-left (safe distance from pet) */}
      <rect x="36" y="92" width="24" height="22" rx="0" fill="#7A6898" stroke="#074F9A" strokeWidth="3" />
      <path d="M36 92 Q48 76 60 92Z" fill="#7A6898" stroke="#074F9A" strokeWidth="3" />
      {/* base slab */}
      <rect x="32" y="112" width="32" height="5" rx="1.5" fill="#6858A0" stroke="#074F9A" strokeWidth="2" />
      {/* decorative arch line */}
      <path d="M40 94 Q48 82 56 94" fill="none" stroke="#074F9A" strokeWidth="1.5" opacity="0.6" />
      <text x="48" y="106" fontSize="4.5" fontWeight="900" fill="#074F9A" textAnchor="middle" fontFamily="monospace" opacity="0.7">RIP</text>

      {/* Stone D — simple rounded headstone, right side */}
      <rect x="180" y="96" width="20" height="18" rx="0" fill="#8070A8" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="180" y="86" width="20" height="15" rx="10" fill="#8070A8" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="176" y="112" width="28" height="4" rx="1" fill="#7060A0" stroke="#074F9A" strokeWidth="2" />
      <text x="190" y="105" fontSize="5" fontWeight="900" fill="#074F9A" textAnchor="middle" fontFamily="monospace" opacity="0.7">RIP</text>

      {/* Stone E — small cross-top stone, far right */}
      <rect x="208" y="97" width="16" height="17" rx="2" fill="#907898" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="213" y="85" width="6" height="15" rx="2" fill="#907898" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="209" y="89" width="14" height="6" rx="2" fill="#907898" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="205" y="112" width="22" height="4" rx="1" fill="#705878" stroke="#074F9A" strokeWidth="2" />

      {/* Pumpkin — charming accent, far right corner */}
      <ellipse cx="232" cy="110" rx="10" ry="8" fill="#FF8C30" stroke="#074F9A" strokeWidth="2.5" />
      <path d="M227 100 Q232 94 237 100" fill="none" stroke="#3A6A28" strokeWidth="3" strokeLinecap="round" />
      <circle cx="229" cy="108" r="2" fill="#1A1020" />
      <circle cx="235" cy="108" r="2" fill="#1A1020" />
      <path d="M228 113 Q232 116 236 113" fill="none" stroke="#1A1020" strokeWidth="2" strokeLinecap="round" />

      {/* Animated drifting cemetery fog — two SEPARATE side banks.
           LEFT bank: ellipses entirely within x=0..70, max translate +8px → max right edge 78 < 75 buffer.
           RIGHT bank: ellipses entirely within x=170..240, max translate −8px → min left edge 162 > 165 buffer.
           Neither group's bounding box ever crosses the center pet zone x≈75..165.              */}
      {/* Left fog bank — entirely within x=0..60 at rest; +6px translate → max right edge=66 < 75 ✓ */}
      <g className="hab-cemetery-fog" style={{ transformOrigin: '30px 114px', transformBox: 'view-box' }}>
        <ellipse cx="28" cy="114" rx="24" ry="7"  fill="white" opacity="0.26" />
        <ellipse cx="14" cy="118" rx="12" ry="5"  fill="white" opacity="0.18" />
        <ellipse cx="48" cy="117" rx="12" ry="4"  fill="white" opacity="0.16" />
      </g>
      {/* Right fog bank — entirely within x=174..240 at rest; +6px translate → min left edge=168 > 165 ✓ */}
      <g className="hab-cemetery-fog" style={{ transformOrigin: '207px 113px', transformBox: 'view-box' }}>
        <ellipse cx="207" cy="113" rx="28" ry="7"  fill="white" opacity="0.24" />
        <ellipse cx="224" cy="117" rx="12" ry="4"  fill="white" opacity="0.17" />
        <ellipse cx="188" cy="116" rx="14" ry="5"  fill="white" opacity="0.15" />
      </g>

      {/* Fireflies / will-o-wisps */}
      {[[100,80],[115,72],[88,90],[130,85]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#C8E840" opacity="0.7" />
      ))}
      {[[100,80],[115,72],[88,90],[130,85]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="6" fill="#C8E840" opacity="0.18" />
      ))}
    </svg>
  );
}

function HabitatScene_Desert() {
  return (
    <svg viewBox="0 0 240 160" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="desertsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B2A" />
          <stop offset="50%" stopColor="#FFB04A" />
          <stop offset="100%" stopColor="#FFD080" />
        </linearGradient>
        <linearGradient id="desertsand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8A840" />
          <stop offset="100%" stopColor="#C87820" />
        </linearGradient>
      </defs>
      <rect width="240" height="160" fill="url(#desertsky)" />
      {/* Sun — low on horizon, heat distortion effect */}
      <circle cx="120" cy="88" r="30" fill="#FFE347" opacity="0.3" />
      <circle cx="120" cy="88" r="22" fill="#FFE347" opacity="0.5" />
      <circle cx="120" cy="100" r="20" fill="#FF9900" stroke="#074F9A" strokeWidth="2.5" />
      <circle cx="120" cy="100" r="13" fill="#FFE347" opacity="0.8" />
      {/* Sand dunes */}
      <path d="M0 100 Q30 80 70 100 Q100 118 140 100 Q180 82 220 100 Q230 104 240 100 L240 160 L0 160Z" fill="url(#desertsand)" stroke="#074F9A" strokeWidth="2.5" />
      {/* Sand ripple lines */}
      <path d="M10 130 Q60 126 110 130 Q160 134 210 130" fill="none" stroke="#D4981E" strokeWidth="2" opacity="0.6" />
      <path d="M0 144 Q50 140 100 144 Q150 148 200 144 Q220 142 240 144" fill="none" stroke="#D4981E" strokeWidth="1.8" opacity="0.5" />
      {/* Cactus — main left */}
      <rect x="28" y="60" width="14" height="52" rx="7" fill="#50A050" stroke="#074F9A" strokeWidth="3" />
      {/* Cactus left arm */}
      <rect x="18" y="70" width="12" height="8" rx="4" fill="#50A050" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="18" y="62" width="8" height="16" rx="4" fill="#50A050" stroke="#074F9A" strokeWidth="2.5" />
      {/* Cactus right arm */}
      <rect x="40" y="76" width="14" height="8" rx="4" fill="#50A050" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="46" y="68" width="8" height="16" rx="4" fill="#50A050" stroke="#074F9A" strokeWidth="2.5" />
      {/* Cactus flower */}
      <circle cx="35" cy="58" r="6" fill="#FF6EB4" stroke="#074F9A" strokeWidth="2" />
      <circle cx="35" cy="58" r="3" fill="#FFE347" />
      {/* Cactus spines */}
      {[[32,70],[32,80],[32,90],[38,70],[38,80],[38,90]].map(([x,y],i) => (
        <line key={i} x1={x} y1={y} x2={x+(i%2===0?-4:4)} y2={y} stroke="#074F9A" strokeWidth="1.5" />
      ))}
      {/* Small cactus — right */}
      <rect x="196" y="80" width="10" height="32" rx="5" fill="#50A050" stroke="#074F9A" strokeWidth="2.5" />
      <rect x="186" y="86" width="12" height="6" rx="3" fill="#50A050" stroke="#074F9A" strokeWidth="2" />
      <rect x="186" y="80" width="6" height="12" rx="3" fill="#50A050" stroke="#074F9A" strokeWidth="2" />
      {/* Skull rock (fun landmark) */}
      <ellipse cx="185" cy="102" rx="16" ry="12" fill="#D8C890" stroke="#074F9A" strokeWidth="2.5" />
      <circle cx="179" cy="99" r="4" fill="#C8B870" stroke="#074F9A" strokeWidth="2" />
      <circle cx="191" cy="99" r="4" fill="#C8B870" stroke="#074F9A" strokeWidth="2" />
      <path d="M179 107 Q185 110 191 107" fill="#C8B870" stroke="#074F9A" strokeWidth="2" />
      {/* Tumbleweed — animated rolling */}
      <g className="hab-desert-tumbleweed" style={{ transformOrigin: '155px 108px', transformBox: 'view-box' }}>
        <circle cx="155" cy="108" r="8" fill="none" stroke="#A07830" strokeWidth="2.5" />
        <path d="M150 103 Q155 108 160 103" fill="none" stroke="#A07830" strokeWidth="2" />
        <path d="M150 113 Q155 108 160 113" fill="none" stroke="#A07830" strokeWidth="2" />
        <path d="M147 108 Q155 108 163 108" fill="none" stroke="#A07830" strokeWidth="2" />
        <line x1="151" y1="104" x2="159" y2="112" stroke="#A07830" strokeWidth="1.5" opacity="0.7" />
        <line x1="159" y1="104" x2="151" y2="112" stroke="#A07830" strokeWidth="1.5" opacity="0.7" />
      </g>
      {/* Heat waves / shimmer lines */}
      <path d="M60 92 Q70 88 80 92 Q90 96 100 92" fill="none" stroke="#FFD080" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      <path d="M140 90 Q152 86 164 90 Q176 94 188 90" fill="none" stroke="#FFD080" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
      {/* Vulture silhouette — tiny, high up */}
      <path d="M210 28 L204 36 L210 34 L216 36 L210 28Z" fill="#1A0A00" opacity="0.7" />
      <path d="M220 22 L214 30 L220 28 L226 30 L220 22Z" fill="#1A0A00" opacity="0.6" />
    </svg>
  );
}

function HabitatScene_Austin() {
  // Pennybacker / 360 Bridge overlook — Lake Austin, limestone Hill Country cliffs,
  // ONE dominant rust-orange through-arch with mathematically correct steep rise.
  // Warm Texas golden-hour sky. Pet on grassy overlook center-bottom.
  const ARCH  = '#C84818'; // rust orange
  const STRK  = '#074F9A'; // Kinotchi deep-blue outline
  const ADARK = '#8C2E08'; // dark rust for underside

  // ── Bridge geometry (corrected Bezier math) ────────────────────────────
  // SVG quadratic Bezier midpoint: y_mid = 0.5*cy + 0.5*(y0+y1)/2 ... but
  // with equal endpoints y0=y1=deckY, midpoint = 0.5*cy + 0.5*deckY.
  // Visible outer crown at y=22 → cy_outer = 2*22 - 94 = -50
  // Visible inner crown at y=34 → cy_inner = 2*34 - 94 = -26
  const deckY   = 94;  // arch spring points and deck top y
  const abutL   = 20;  // left spring x
  const abutR   = 220; // right spring x
  const midX    = 120;
  const cyOuter = -50; // Bezier control y for top edge → visible crown y=22
  const cyInner = -26; // Bezier control y for underside → visible crown y=34

  // Real quadratic Bezier y for the UNDERSIDE curve at parameter t:
  // y(t) = (1-t)²·deckY + 2·(1-t)·t·cyInner + t²·deckY
  //       = deckY + 2·t·(1-t)·(cyInner - deckY)
  //       = 94 + 2t(1-t)(-26-94) = 94 - 240·t·(1-t)
  // Center (t=0.5): 94 - 60 = 34 ✓   Edge (t=0): 94 ✓
  const undersideY = (x: number): number => {
    const t = (x - abutL) / (abutR - abutL);
    return deckY + 2 * t * (1 - t) * (cyInner - deckY); // = 94 - 240t(1-t)
  };

  // 9 evenly spaced hanger x positions inside the span
  const hangers: number[] = [38, 58, 78, 98, 120, 142, 162, 182, 202];

  return (
    <svg viewBox="0 0 240 160" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="austinsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3A5A8A" />
          <stop offset="45%"  stopColor="#E07830" />
          <stop offset="80%"  stopColor="#F4A840" />
          <stop offset="100%" stopColor="#F8C860" />
        </linearGradient>
        {/* Lake Austin — clear teal so it reads as open water, not landscape */}
        <linearGradient id="austinriver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3A9090" />
          <stop offset="100%" stopColor="#246878" />
        </linearGradient>
        {/* Limestone cliff — warm tan */}
        <linearGradient id="austincliff" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D4C498" />
          <stop offset="100%" stopColor="#B8A878" />
        </linearGradient>
        {/* Foreground grassy overlook */}
        <linearGradient id="austinground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7AAA40" />
          <stop offset="100%" stopColor="#507030" />
        </linearGradient>
      </defs>

      {/* ── Sky ── */}
      <rect width="240" height="160" fill="url(#austinsky)" />

      {/* Sun — upper right corner, clear of arch */}
      <circle cx="210" cy="13" r="14" fill="#FFE050" opacity="0.28" />
      <circle cx="210" cy="13" r="9"  fill="#FFCC30" opacity="0.55" />
      <circle cx="210" cy="13" r="6"  fill="#FFE87A" stroke={STRK} strokeWidth="2" />

      {/* ── Left limestone cliff bank ── */}
      <path d={`M0 58 Q12 50 ${abutL + 4} 58 L${abutL + 12} ${deckY - 4} L0 ${deckY - 4}Z`}
        fill="url(#austincliff)" stroke={STRK} strokeWidth="2" />
      <line x1="0" y1="66" x2={abutL + 10} y2="66" stroke="#A89860" strokeWidth="1.5" opacity="0.75" />
      <line x1="0" y1="74" x2={abutL + 11} y2="74" stroke="#A89860" strokeWidth="1.5" opacity="0.7" />
      <line x1="0" y1="82" x2={abutL + 12} y2="82" stroke="#A89860" strokeWidth="1.5" opacity="0.65" />
      {/* Cedar trees on left cliff top */}
      {([6, 14, 22] as number[]).map((x, i) => (
        <g key={i}>
          <rect x={x - 1} y="48" width="3" height="12" rx="1" fill="#3A2808" />
          <path d={`M${x - 5} 60 L${x} 42 L${x + 5} 60Z`} fill="#486030" stroke={STRK} strokeWidth="1.5" />
          <path d={`M${x - 4} 54 L${x} 40 L${x + 4} 54Z`} fill="#5A7840" />
        </g>
      ))}

      {/* ── Right limestone cliff bank ── */}
      <path d={`M${abutR - 12} 58 Q${abutR - 4} 50 240 58 L240 ${deckY - 4} L${abutR - 12} ${deckY - 4}Z`}
        fill="url(#austincliff)" stroke={STRK} strokeWidth="2" />
      <line x1={abutR - 10} y1="66" x2="240" y2="66" stroke="#A89860" strokeWidth="1.5" opacity="0.75" />
      <line x1={abutR - 12} y1="74" x2="240" y2="74" stroke="#A89860" strokeWidth="1.5" opacity="0.7" />
      <line x1={abutR - 12} y1="82" x2="240" y2="82" stroke="#A89860" strokeWidth="1.5" opacity="0.65" />
      {/* Cedar trees on right cliff top */}
      {([218, 228, 237] as number[]).map((x, i) => (
        <g key={i}>
          <rect x={x - 1} y="48" width="3" height="12" rx="1" fill="#3A2808" />
          <path d={`M${x - 5} 60 L${x} 42 L${x + 5} 60Z`} fill="#486030" stroke={STRK} strokeWidth="1.5" />
          <path d={`M${x - 4} 54 L${x} 40 L${x + 4} 54Z`} fill="#5A7840" />
        </g>
      ))}

      {/* ── Lake Austin — clear teal channel beneath and behind deck ──
           Extends from deckY-4 (=90) down to y=120, so it shows between
           the bottom of the bridge deck and the top of the foreground overlook. */}
      <rect x="0" y={deckY - 4} width="240" height="26" fill="url(#austinriver)" />
      {/* Water shimmer lines */}
      <path d={`M0 ${deckY + 4} Q120 ${deckY} 240 ${deckY + 4}`}
        fill="none" stroke="#70C8C8" strokeWidth="1.5" opacity="0.5" />
      <path d={`M0 ${deckY + 12} Q120 ${deckY + 8} 240 ${deckY + 12}`}
        fill="none" stroke="#60B8B8" strokeWidth="1.2" opacity="0.35" />

      {/* ══════════════════════════════════════════════════════════════
          PENNYBACKER BRIDGE
          Arch: ONE filled shape — no second parallel curve, no shadow rib.
          Underside path sets the 12-unit arch thickness.
          Hangers: 9 bold white-outlined rods from arch down to deck.
          Deck: dark navy slab — visually distinct from orange arch.
          ══════════════════════════════════════════════════════════════ */}

      {/* Abutment piers — tan limestone blocks, substantial */}
      <rect x={abutL - 12} y={deckY - 12} width="24" height="26" rx="3"
        fill="#C0A878" stroke={STRK} strokeWidth="2.5" />
      <line x1={abutL - 12} y1={deckY - 4} x2={abutL + 12} y2={deckY - 4}
        stroke={STRK} strokeWidth="1.5" opacity="0.55" />
      <rect x={abutR - 12} y={deckY - 12} width="24" height="26" rx="3"
        fill="#C0A878" stroke={STRK} strokeWidth="2.5" />
      <line x1={abutR - 12} y1={deckY - 4} x2={abutR + 12} y2={deckY - 4}
        stroke={STRK} strokeWidth="1.5" opacity="0.55" />

      {/* ARCH — single filled shape, mathematically correct Bezier controls.
           Outer top edge: M abutL deckY  Q midX cyOuter  abutR deckY  → crown y=22
           Inner underside: reversed back Q midX cyInner abutL deckY → crown y=34
           This produces a ≈12-unit thick arch body, steeply rising. */}
      <path
        d={`M${abutL} ${deckY}
            Q${midX} ${cyOuter} ${abutR} ${deckY}
            Q${midX} ${cyInner} ${abutL} ${deckY}Z`}
        fill={ARCH}
      />
      {/* Top edge outline */}
      <path d={`M${abutL} ${deckY} Q${midX} ${cyOuter} ${abutR} ${deckY}`}
        fill="none" stroke={STRK} strokeWidth="2.5" strokeLinecap="round" />
      {/* Underside edge outline */}
      <path d={`M${abutL} ${deckY} Q${midX} ${cyInner} ${abutR} ${deckY}`}
        fill="none" stroke={ADARK} strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      {/* HANGERS — 9 bold rods from underside of arch to top of road deck.
           topY = undersideY(x) — longest at centre (y=34→82=48 units),
           shortest at edges (t≈0.09 → y≈74→82=8 units). All topY < botY ✓ */}
      {hangers.map((x, i) => {
        const topY = undersideY(x);  // real Bezier underside y
        const botY = deckY - 12;     // top of road deck slab (=82)
        return (
          <g key={i}>
            <line x1={x} y1={topY} x2={x} y2={botY} stroke="white" strokeWidth="4.5" opacity="0.5" />
            <line x1={x} y1={topY} x2={x} y2={botY} stroke={ARCH}  strokeWidth="3" />
            <line x1={x} y1={topY} x2={x} y2={botY} stroke={STRK}  strokeWidth="1" opacity="0.65" />
          </g>
        );
      })}

      {/* ROAD DECK — dark navy slab, clearly distinct from orange arch */}
      <rect x={abutL - 12} y={deckY - 12} width={abutR - abutL + 24} height="12" rx="2"
        fill="#2A3A60" stroke={STRK} strokeWidth="2.5" />
      {/* Road centreline dashes — yellow, high-contrast */}
      <path d={`M${abutL} ${deckY - 6} L${abutR} ${deckY - 6}`}
        fill="none" stroke="#F8D860" strokeWidth="2" strokeDasharray="9 7" opacity="0.85" />
      {/* Deck underside shadow strip */}
      <rect x={abutL - 12} y={deckY} width={abutR - abutL + 24} height="4"
        fill={ADARK} opacity="0.3" />

      {/* ── Animated bats emerging from beneath the inner bridge span ──
           One continuous stream, center-left spawn (x=76–92, y=88–96),
           traveling diagonally upper-right and exiting past the card boundary.
           Desktop 5-col card: xMidYMid slice, visible SVG x≈48..192.
           All bats fade in briefly at spawn, stay opaque across the sky,
           fade only near the upper-right exit so reset is hidden.
           transformBox:'view-box' + absolute transformOrigin. Pose variants:
             A = wings-high (bat1, bat3, bat5)
             B = wings-level (bat2, bat6)
             C = wings-down (bat4)
           Each bat rotated slightly so silhouette banks into the flight vector. */}

      {/* ── Bat pose A — wings swept high, banking upper-right ──
           Body: tapered oval + pointed tail. Head: small oval + two sharp ears.
           Left wing: long, swept-back, pointed outer tip, one scallop notch.
           Right wing: shorter (leading), pointed tip, one scallop.
           Overall group rotated -22° to bank into upper-right travel.           */}

      {/* bat 1 — large, spawn (84, 92) — Pose A */}
      <g className="hab-austin-bat-1"
         style={{ transformOrigin: '84px 92px', transformBox: 'view-box' }}>
        <g transform="translate(84,92) rotate(-22) scale(1.05)">
          {/* body */}
          <path d="M-1.5 -3 C-2.5 0 -2 4 0 6 C2 4 2.5 0 1.5 -3 Z" fill="#0C1028" />
          {/* head */}
          <ellipse cx="0" cy="-4.5" rx="2.2" ry="1.8" fill="#0C1028" />
          {/* ear left */}
          <path d="M-1.8 -5.5 L-3.2 -8.5 L-0.4 -6.2 Z" fill="#0C1028" />
          {/* ear right */}
          <path d="M1.8 -5.5 L3.2 -8.5 L0.4 -6.2 Z" fill="#0C1028" />
          {/* left wing — long swept-back, high */}
          <path d="M-2 -2
            C-5 -6 -10 -10 -16 -11
            C-20 -11.5 -26 -9 -28 -6
            C-24 -4 -18 -4.5 -12 -3.5
            C-8 -2.5 -4 -1.5 -2 -2 Z" fill="#0C1028" />
          {/* left wing scallop notch */}
          <path d="M-28 -6 C-25 -8 -22 -5 -18 -7" fill="none" stroke="#0C1028" strokeWidth="0.9" />
          {/* right wing — shorter leading wing */}
          <path d="M2 -2
            C5 -5 9 -8 14 -9
            C18 -9.5 22 -7.5 23 -5
            C20 -3 16 -3.5 11 -3
            C7 -2 4 -1.5 2 -2 Z" fill="#0C1028" />
          {/* right wing scallop */}
          <path d="M23 -5 C21 -7 18 -4.5 15 -6" fill="none" stroke="#0C1028" strokeWidth="0.9" />
        </g>
      </g>

      {/* bat 2 — medium, spawn (80, 88) — Pose B (wings level) */}
      <g className="hab-austin-bat-2"
         style={{ transformOrigin: '80px 88px', transformBox: 'view-box' }}>
        <g transform="translate(80,88) rotate(-18) scale(0.88)">
          {/* body */}
          <path d="M-1.5 -3 C-2.5 0 -2 4 0 6 C2 4 2.5 0 1.5 -3 Z" fill="#0C1028" />
          {/* head */}
          <ellipse cx="0" cy="-4.5" rx="2.2" ry="1.8" fill="#0C1028" />
          {/* ear left */}
          <path d="M-1.8 -5.5 L-3.2 -8.5 L-0.4 -6.2 Z" fill="#0C1028" />
          {/* ear right */}
          <path d="M1.8 -5.5 L3.2 -8.5 L0.4 -6.2 Z" fill="#0C1028" />
          {/* left wing — level, long */}
          <path d="M-2 -1
            C-5 -3 -10 -4 -17 -3.5
            C-22 -3 -27 -1 -28 2
            C-24 3.5 -18 2.5 -12 1.5
            C-7 0.5 -4 0 -2 -1 Z" fill="#0C1028" />
          <path d="M-28 2 C-25 0 -21 2.5 -17 1" fill="none" stroke="#0C1028" strokeWidth="0.9" />
          {/* right wing — level */}
          <path d="M2 -1
            C5 -3 10 -4 16 -3.5
            C21 -3 25 -1 26 2
            C22 3.5 17 2.5 11 1.5
            C7 0.5 4 0 2 -1 Z" fill="#0C1028" />
          <path d="M26 2 C23 0 20 2.5 16 1" fill="none" stroke="#0C1028" strokeWidth="0.9" />
        </g>
      </g>

      {/* bat 3 — large, spawn (88, 94) — Pose A variant (slightly more banked) */}
      <g className="hab-austin-bat-3"
         style={{ transformOrigin: '88px 94px', transformBox: 'view-box' }}>
        <g transform="translate(88,94) rotate(-25) scale(1.0)">
          <path d="M-1.5 -3 C-2.5 0 -2 4 0 6 C2 4 2.5 0 1.5 -3 Z" fill="#0C1028" />
          <ellipse cx="0" cy="-4.5" rx="2.2" ry="1.8" fill="#0C1028" />
          <path d="M-1.8 -5.5 L-3.2 -8.5 L-0.4 -6.2 Z" fill="#0C1028" />
          <path d="M1.8 -5.5 L3.2 -8.5 L0.4 -6.2 Z" fill="#0C1028" />
          {/* left wing high */}
          <path d="M-2 -2
            C-5 -7 -11 -11 -17 -12
            C-21 -12.5 -27 -9.5 -29 -6.5
            C-25 -4.5 -18 -5 -12 -3.5
            C-7 -2.5 -4 -1.5 -2 -2 Z" fill="#0C1028" />
          <path d="M-29 -6.5 C-26 -9 -22 -5.5 -18 -7.5" fill="none" stroke="#0C1028" strokeWidth="0.9" />
          {/* right wing high */}
          <path d="M2 -2
            C5 -6 10 -9 15 -10
            C19 -10.5 23 -8.5 24 -5.5
            C21 -3.5 16 -4 11 -3
            C7 -2 4 -1.5 2 -2 Z" fill="#0C1028" />
          <path d="M24 -5.5 C22 -8 18 -5 15 -7" fill="none" stroke="#0C1028" strokeWidth="0.9" />
        </g>
      </g>

      {/* bat 4 — small, spawn (78, 90) — Pose C (wings slightly down) */}
      <g className="hab-austin-bat-4"
         style={{ transformOrigin: '78px 90px', transformBox: 'view-box' }}>
        <g transform="translate(78,90) rotate(-15) scale(0.80)">
          <path d="M-1.5 -3 C-2.5 0 -2 4 0 6 C2 4 2.5 0 1.5 -3 Z" fill="#0C1028" />
          <ellipse cx="0" cy="-4.5" rx="2.2" ry="1.8" fill="#0C1028" />
          <path d="M-1.8 -5.5 L-3.2 -8.5 L-0.4 -6.2 Z" fill="#0C1028" />
          <path d="M1.8 -5.5 L3.2 -8.5 L0.4 -6.2 Z" fill="#0C1028" />
          {/* left wing angled slightly down */}
          <path d="M-2 0
            C-5 0 -10 2 -17 4
            C-22 5.5 -27 4 -28 1
            C-24 -1.5 -18 -1 -12 -0.5
            C-7 0 -4 0 -2 0 Z" fill="#0C1028" />
          <path d="M-28 1 C-25 3 -21 0.5 -17 2.5" fill="none" stroke="#0C1028" strokeWidth="0.9" />
          {/* right wing slightly down */}
          <path d="M2 0
            C5 0 10 2 16 4
            C21 5.5 25 4 26 1
            C22 -1.5 17 -1 11 -0.5
            C7 0 4 0 2 0 Z" fill="#0C1028" />
          <path d="M26 1 C23 3 20 0.5 16 2.5" fill="none" stroke="#0C1028" strokeWidth="0.9" />
        </g>
      </g>

      {/* bat 5 — medium-large, spawn (86, 96) — Pose A */}
      <g className="hab-austin-bat-5"
         style={{ transformOrigin: '86px 96px', transformBox: 'view-box' }}>
        <g transform="translate(86,96) rotate(-20) scale(0.93)">
          <path d="M-1.5 -3 C-2.5 0 -2 4 0 6 C2 4 2.5 0 1.5 -3 Z" fill="#0C1028" />
          <ellipse cx="0" cy="-4.5" rx="2.2" ry="1.8" fill="#0C1028" />
          <path d="M-1.8 -5.5 L-3.2 -8.5 L-0.4 -6.2 Z" fill="#0C1028" />
          <path d="M1.8 -5.5 L3.2 -8.5 L0.4 -6.2 Z" fill="#0C1028" />
          <path d="M-2 -2
            C-5 -6 -10 -10 -16 -11
            C-20 -11.5 -26 -9 -28 -6
            C-24 -4 -18 -4.5 -12 -3.5
            C-8 -2.5 -4 -1.5 -2 -2 Z" fill="#0C1028" />
          <path d="M-28 -6 C-25 -8 -22 -5 -18 -7" fill="none" stroke="#0C1028" strokeWidth="0.9" />
          <path d="M2 -2
            C5 -5 9 -8 14 -9
            C18 -9.5 22 -7.5 23 -5
            C20 -3 16 -3.5 11 -3
            C7 -2 4 -1.5 2 -2 Z" fill="#0C1028" />
          <path d="M23 -5 C21 -7 18 -4.5 15 -6" fill="none" stroke="#0C1028" strokeWidth="0.9" />
        </g>
      </g>

      {/* bat 6 — small, spawn (76, 88) — Pose B (wings level) */}
      <g className="hab-austin-bat-6"
         style={{ transformOrigin: '76px 88px', transformBox: 'view-box' }}>
        <g transform="translate(76,88) rotate(-16) scale(0.75)">
          <path d="M-1.5 -3 C-2.5 0 -2 4 0 6 C2 4 2.5 0 1.5 -3 Z" fill="#0C1028" />
          <ellipse cx="0" cy="-4.5" rx="2.2" ry="1.8" fill="#0C1028" />
          <path d="M-1.8 -5.5 L-3.2 -8.5 L-0.4 -6.2 Z" fill="#0C1028" />
          <path d="M1.8 -5.5 L3.2 -8.5 L0.4 -6.2 Z" fill="#0C1028" />
          <path d="M-2 -1
            C-5 -3 -10 -4 -17 -3.5
            C-22 -3 -27 -1 -28 2
            C-24 3.5 -18 2.5 -12 1.5
            C-7 0.5 -4 0 -2 -1 Z" fill="#0C1028" />
          <path d="M-28 2 C-25 0 -21 2.5 -17 1" fill="none" stroke="#0C1028" strokeWidth="0.9" />
          <path d="M2 -1
            C5 -3 10 -4 16 -3.5
            C21 -3 25 -1 26 2
            C22 3.5 17 2.5 11 1.5
            C7 0.5 4 0 2 -1 Z" fill="#0C1028" />
          <path d="M26 2 C23 0 20 2.5 16 1" fill="none" stroke="#0C1028" strokeWidth="0.9" />
        </g>
      </g>

      {/* ── Foreground overlook — raised to y=104 so pet sits on grass ──
           The river band is 90..116; foreground top at 104 leaves a visible
           ~14-unit teal water strip above it (outside center pet zone),
           then the grassy overlook fills 104→160. */}
      <path d="M0 104 Q40 98 80 104 Q120 110 160 104 Q200 98 240 104 L240 160 L0 160Z"
        fill="url(#austinground)" stroke={STRK} strokeWidth="2.5" />
      {/* Grass texture line */}
      <path d="M0 114 Q60 110 120 114 Q180 118 240 114"
        fill="none" stroke="#508028" strokeWidth="1.8" opacity="0.5" />
      {/* Left limestone slab — clear of center pet stage */}
      <path d="M8 108 Q22 102 40 106 L40 114 L8 114Z"
        fill="#C8B880" stroke={STRK} strokeWidth="2" />
      <path d="M12 106 Q27 102 36 105" fill="none" stroke="#A89860" strokeWidth="1.5" opacity="0.7" />
      {/* Right limestone slab */}
      <path d="M192 106 Q212 102 234 106 L234 114 L192 114Z"
        fill="#C8B880" stroke={STRK} strokeWidth="2" />
      <path d="M196 105 Q214 101 230 105" fill="none" stroke="#A89860" strokeWidth="1.5" opacity="0.7" />
      {/* Left foreground cedar */}
      <rect x="16" y="102" width="3" height="10" rx="1" fill="#3A2808" />
      <path d="M10 112 L18 95 L26 112Z"  fill="#486030" stroke={STRK} strokeWidth="2" />
      <path d="M12 107 L18 93 L24 107Z"  fill="#5A7840" />
      {/* Right foreground cedar */}
      <rect x="221" y="102" width="3" height="10" rx="1" fill="#3A2808" />
      <path d="M215 112 L223 95 L231 112Z"  fill="#486030" stroke={STRK} strokeWidth="2" />
      <path d="M217 107 L223 93 L229 107Z"  fill="#5A7840" />
    </svg>
  );
}

type HabitatSceneComponent = React.FC;

const HABITAT_SCENES: Record<string, HabitatSceneComponent> = {
  'sf-bay':          HabitatScene_SFBay,
  'los-angeles':     HabitatScene_LA,
  'japan':           HabitatScene_Japan,
  'beach':           HabitatScene_Beach,
  'space':           HabitatScene_Space,
  'launch-pad':      HabitatScene_LaunchPad,
  'rocket-interior': HabitatScene_RocketInterior,
  'spooky-cemetery': HabitatScene_SpookyCemetery,
  'desert':          HabitatScene_Desert,
  'austin':          HabitatScene_Austin,
};

// ---------------------------------------------------------------------------
// CONFETTI
// ---------------------------------------------------------------------------

const CONFETTI = [
  ['12%', '20%', '#FFE347', '-28deg'],
  ['24%', '11%', '#25B7A9', '34deg'],
  ['38%', '7%',  '#F04B78', '78deg'],
  ['61%', '8%',  '#25B7A9', '-46deg'],
  ['78%', '19%', '#FFE347', '26deg'],
  ['89%', '33%', '#F04B78', '-62deg'],
  ['8%',  '42%', '#E65F40', '84deg'],
  ['18%', '59%', '#25B7A9', '-72deg'],
  ['84%', '57%', '#E65F40', '24deg'],
  ['74%', '74%', '#FFE347', '-48deg'],
  ['51%', '85%', '#F04B78', '80deg'],
  ['29%', '80%', '#25B7A9', '28deg'],
  ['9%',  '74%', '#FFE347', '-16deg'],
];

// ---------------------------------------------------------------------------
// EGG WIDGET THEME SYSTEM
// ---------------------------------------------------------------------------

type EggThemeId = 'sprinkle' | 'dino' | 'zelda' | 'astartes';

interface EggTheme {
  id: EggThemeId;
  label: string;
  /** Shell SVG fill */
  shellGradient: { id: string; stops: Array<{ offset: string; color: string }> };
  shellStroke: string;
  shellDropShadow: string;
  /** Surface decoration rendered over the shell */
  ShellDecor: React.FC;
  /** Logo text color */
  logoColor: string;
  /** Outer frame background & shadow */
  frameOuter: string;
  frameShadow: string;
  /** Inner frame fill */
  frameInner: string;
  /** Viewport border */
  viewportBorder: string;
  /** Top/bottom bar background */
  barBg: string;
  barBorder: string;
  /** Bottom buttons */
  btnBorder: string;
  btnActive: string;
  btnInactive: string;
  btnShadow: string;
  btnText: string;
  /** Day badge */
  badgeBg: string;
  badgeText: string;
}

// ---- Theme: Sprinkle (original) -------------------------------------------
const sprinkleDecor: React.FC = () => (
  <>
    {CONFETTI.map(([left, top, backgroundColor, rotate]) => (
      <span key={`${left}-${top}`} className="absolute h-2 w-6 rounded-full border-2 border-[#B45F7A]" style={{ left, top, backgroundColor, transform: `rotate(${rotate})` }} />
    ))}
  </>
);

// ---- Theme: Dinosaur Egg ---------------------------------------------------
// Earthy/mossy shell with organic polka spots and speckling.
const dinoDecor: React.FC = () => {
  // Irregular organic spots: [cx%, cy%, rx, ry, rotate, fill, opacity]
  const spots: Array<[string, string, number, number, number, string, number]> = [
    ['14%', '18%', 8, 6, -20, '#5A7A2A', 0.75],
    ['74%', '12%', 7, 5,  35, '#4D6B22', 0.70],
    ['88%', '38%', 6, 9,  60, '#6B8C35', 0.65],
    ['82%', '68%', 8, 5, -15, '#4A6120', 0.72],
    ['62%', '82%', 7, 6,  25, '#5A7A2A', 0.68],
    ['28%', '85%', 9, 6, -40, '#3D5A18', 0.70],
    ['8%',  '60%', 6, 8,  50, '#6B8C35', 0.65],
    ['10%', '38%', 7, 5, -10, '#4D6B22', 0.73],
    ['48%', '8%',  5, 4,  15, '#5A7A2A', 0.62],
    ['38%', '20%', 4, 3,  -5, '#3D5A18', 0.55],
    ['66%', '52%', 5, 4,  40, '#4D6B22', 0.60],
    ['22%', '52%', 4, 5, -30, '#6B8C35', 0.58],
  ];
  // Tiny speckles
  const speckles: Array<[string, string, number, string]> = [
    ['30%','14%',3,'#3D5A18'],['55%','22%',2,'#5A7A2A'],['75%','30%',2,'#4D6B22'],
    ['20%','72%',2,'#6B8C35'],['45%','88%',3,'#3D5A18'],['85%','55%',2,'#4A6120'],
    ['58%','70%',2,'#5A7A2A'],['12%','82%',3,'#4D6B22'],['70%','78%',2,'#3D5A18'],
  ];
  return (
    <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 370 444" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      {spots.map(([cx, cy, rx, ry, rot, fill, opacity], i) => {
        const cxN = parseFloat(cx) / 100 * 370;
        const cyN = parseFloat(cy) / 100 * 444;
        return (
          <ellipse key={i} cx={cxN} cy={cyN} rx={rx * 3.5} ry={ry * 3.5} fill={fill} fillOpacity={opacity} transform={`rotate(${rot},${cxN},${cyN})`} />
        );
      })}
      {speckles.map(([cx, cy, r, fill], i) => {
        const cxN = parseFloat(cx) / 100 * 370;
        const cyN = parseFloat(cy) / 100 * 444;
        return <circle key={`sp-${i}`} cx={cxN} cy={cyN} r={parseFloat(r as unknown as string)} fill={fill} fillOpacity={0.5} />;
      })}
    </svg>
  );
};

// ---- Theme: Legend of Zelda -----------------------------------------------
// Enchanted forest-green relic with aged gold trim, leaf/triforce motifs.
const zeldaDecor: React.FC = () => (
  <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 370 444" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{ pointerEvents: 'none' }}>
    {/* Gold filigree border accents */}
    <ellipse cx="185" cy="40" rx="48" ry="6" fill="none" stroke="#C8961E" strokeWidth="1.5" strokeDasharray="4 3" />
    <ellipse cx="185" cy="404" rx="48" ry="6" fill="none" stroke="#C8961E" strokeWidth="1.5" strokeDasharray="4 3" />
    {/* Left/right vine arcs */}
    <path d="M44 180 Q28 220 44 265" fill="none" stroke="#5A8C3A" strokeWidth="2" strokeLinecap="round" />
    <path d="M326 180 Q342 220 326 265" fill="none" stroke="#5A8C3A" strokeWidth="2" strokeLinecap="round" />
    {/* Small leaf clusters on vines */}
    {([[44,195,-20],[44,250,15],[326,195,20],[326,250,-15]] as [number,number,number][]).map(([x,y,rot],i) => (
      <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
        <ellipse cx="0" cy="-7" rx="5" ry="8" fill="#73C95D" fillOpacity="0.85" />
        <line x1="0" y1="0" x2="0" y2="-14" stroke="#3D7A2B" strokeWidth="1" />
      </g>
    ))}
    {/* Top triforce-adjacent triangle motif (three small triangles arranged) */}
    <g transform="translate(185,60)">
      <polygon points="0,-10 8,4 -8,4"   fill="#C8961E" fillOpacity="0.8" />
      <polygon points="-10,4 -2,18 -18,18" fill="#C8961E" fillOpacity="0.7" />
      <polygon points="10,4 18,18 2,18"  fill="#C8961E" fillOpacity="0.7" />
    </g>
    {/* Bottom sword-hilt line */}
    <g transform="translate(185,390)">
      <rect x="-1" y="-10" width="2" height="16" fill="#C8961E" fillOpacity="0.7" rx="1" />
      <rect x="-9" y="-2" width="18" height="3" fill="#C8961E" fillOpacity="0.7" rx="1.5" />
      <circle cx="0" cy="8" r="3" fill="#5DA85D" fillOpacity="0.8" />
    </g>
    {/* Corner gem accents */}
    {([[70,85],[300,85],[70,360],[300,360]] as [number,number][]).map(([x,y],i) => (
      <polygon key={i} points={`${x},${y-6} ${x+5},${y} ${x},${y+6} ${x-5},${y}`} fill="#5DA85D" fillOpacity="0.75" />
    ))}
    {/* Subtle star-of-ruto sparkles */}
    {([[55,145,7],[315,145,7],[55,300,7],[315,300,7]] as [number,number,number][]).map(([x,y,r],i) => (
      <g key={`star-${i}`} transform={`translate(${x},${y})`}>
        <line x1="0" y1={-r} x2="0" y2={r} stroke="#C8961E" strokeWidth="1" strokeOpacity="0.6" />
        <line x1={-r} y1="0" x2={r} y2="0" stroke="#C8961E" strokeWidth="1" strokeOpacity="0.6" />
      </g>
    ))}
  </svg>
);

// ---- Theme: Warhammer Astartes --------------------------------------------
// Deep armored blue ceramite, gold trim, rivets, panel lines, gothic badge.
const astartesDecor: React.FC = () => (
  <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 370 444" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{ pointerEvents: 'none' }}>
    {/* Armor panel seam lines */}
    <path d="M100 80 L185 50 L270 80" fill="none" stroke="#B8922A" strokeWidth="1.5" strokeOpacity="0.7" />
    <path d="M80 360 L185 395 L290 360" fill="none" stroke="#B8922A" strokeWidth="1.5" strokeOpacity="0.7" />
    <path d="M52 160 L52 285" fill="none" stroke="#B8922A" strokeWidth="1" strokeOpacity="0.6" />
    <path d="M318 160 L318 285" fill="none" stroke="#B8922A" strokeWidth="1" strokeOpacity="0.6" />
    {/* Gold rivets along panel seams */}
    {([
      [100,80],[130,68],[160,57],[185,50],[210,57],[240,68],[270,80],
      [80,360],[120,380],[160,390],[185,395],[210,390],[250,380],[290,360],
      [52,160],[52,200],[52,245],[52,285],
      [318,160],[318,200],[318,245],[318,285],
    ] as [number,number][]).map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="3" fill="#B8922A" fillOpacity="0.85" />
    ))}
    {/* Central gothic winged badge — compact, toy-readable */}
    <g transform="translate(185,72)">
      {/* Wings — left */}
      <path d="M-6,0 Q-22,-12 -30,-5 Q-22,0 -14,5 Z" fill="#B8922A" fillOpacity="0.8" />
      <path d="M-14,5 Q-26,6 -28,14 Q-18,10 -10,10 Z" fill="#B8922A" fillOpacity="0.65" />
      {/* Wings — right (mirrored) */}
      <path d="M6,0 Q22,-12 30,-5 Q22,0 14,5 Z" fill="#B8922A" fillOpacity="0.8" />
      <path d="M14,5 Q26,6 28,14 Q18,10 10,10 Z" fill="#B8922A" fillOpacity="0.65" />
      {/* Central skull-like orb — simplified, friendly */}
      <circle cx="0" cy="3" r="6" fill="#8FAFD4" stroke="#B8922A" strokeWidth="1" />
      <circle cx="-2" cy="2" r="1.5" fill="#1A3A6A" fillOpacity="0.8" />
      <circle cx="2" cy="2" r="1.5" fill="#1A3A6A" fillOpacity="0.8" />
      <path d="M-2,5.5 Q0,7 2,5.5" fill="none" stroke="#1A3A6A" strokeWidth="1" strokeLinecap="round" />
    </g>
    {/* Bottom chapter mark — aquila-like horizontal bar */}
    <g transform="translate(185,390)">
      <rect x="-22" y="-2" width="44" height="4" fill="#B8922A" fillOpacity="0.7" rx="2" />
      <rect x="-8" y="-8" width="16" height="12" fill="#B8922A" fillOpacity="0.5" rx="2" />
      <circle cx="0" cy="-2" r="4" fill="#8FAFD4" stroke="#B8922A" strokeWidth="1" />
    </g>
    {/* Corner honor-guard marks */}
    {([[70,120],[300,120],[70,325],[300,325]] as [number,number][]).map(([x,y],i) => (
      <g key={i} transform={`translate(${x},${y})`}>
        <rect x="-5" y="-5" width="10" height="10" fill="none" stroke="#B8922A" strokeWidth="1" strokeOpacity="0.65" transform="rotate(45)" />
        <circle cx="0" cy="0" r="2" fill="#B8922A" fillOpacity="0.6" />
      </g>
    ))}
  </svg>
);

// ---- Theme definitions ----------------------------------------------------
const EGG_THEMES: Record<EggThemeId, EggTheme> = {
  sprinkle: {
    id: 'sprinkle',
    label: 'Sprinkle',
    shellGradient: {
      id: 'egg-shell-sprinkle',
      stops: [
        { offset: '0', color: '#FFD0DF' },
        { offset: '.55', color: '#F7ABC7' },
        { offset: '1', color: '#D987AA' },
      ],
    },
    shellStroke: '#E77F9D',
    shellDropShadow: '#074F9A',
    ShellDecor: sprinkleDecor,
    logoColor: '#B51E5D',
    frameOuter: '#4B3642',
    frameShadow: '#B98D75',
    frameInner: '#FFE878',
    viewportBorder: '#4B3642',
    barBg: '#A7E3D5',
    barBorder: '#4B3642',
    btnBorder: '#4B3642',
    btnActive: '#B98568',
    btnInactive: '#A87366',
    btnShadow: '#7A4D48',
    btnText: '#FFF1D6',
    badgeBg: '#4B3642',
    badgeText: '#FFE878',
  },
  dino: {
    id: 'dino',
    label: 'Dino Egg',
    shellGradient: {
      id: 'egg-shell-dino',
      stops: [
        { offset: '0', color: '#D4E8A8' },
        { offset: '.45', color: '#B8D87A' },
        { offset: '1', color: '#8AAD48' },
      ],
    },
    shellStroke: '#5A7A2A',
    shellDropShadow: '#3D5A18',
    ShellDecor: dinoDecor,
    logoColor: '#3D6B18',
    frameOuter: '#4A3820',
    frameShadow: '#8A7040',
    frameInner: '#E8D870',
    viewportBorder: '#4A3820',
    barBg: '#B8D87A',
    barBorder: '#4A3820',
    btnBorder: '#4A3820',
    btnActive: '#7A9A3A',
    btnInactive: '#6B8C2A',
    btnShadow: '#3D5A18',
    btnText: '#F0F8D8',
    badgeBg: '#4A3820',
    badgeText: '#E8D870',
  },
  zelda: {
    id: 'zelda',
    label: 'Zelda',
    shellGradient: {
      id: 'egg-shell-zelda',
      stops: [
        { offset: '0', color: '#4A7A44' },
        { offset: '.50', color: '#2D5C2A' },
        { offset: '1', color: '#1A3D18' },
      ],
    },
    shellStroke: '#C8961E',
    shellDropShadow: '#7A6010',
    ShellDecor: zeldaDecor,
    logoColor: '#C8961E',
    frameOuter: '#2A1E08',
    frameShadow: '#C8961E',
    frameInner: '#C8961E',
    viewportBorder: '#2A1E08',
    barBg: '#2D5C2A',
    barBorder: '#C8961E',
    btnBorder: '#2A1E08',
    btnActive: '#C8961E',
    btnInactive: '#8A6414',
    btnShadow: '#4A380A',
    btnText: '#FFEEA0',
    badgeBg: '#2A1E08',
    badgeText: '#C8961E',
  },
  astartes: {
    id: 'astartes',
    label: 'Astartes',
    shellGradient: {
      id: 'egg-shell-astartes',
      stops: [
        { offset: '0', color: '#3A6090' },
        { offset: '.50', color: '#1E3E6A' },
        { offset: '1', color: '#0E2040' },
      ],
    },
    shellStroke: '#B8922A',
    shellDropShadow: '#6A5010',
    ShellDecor: astartesDecor,
    logoColor: '#B8922A',
    frameOuter: '#0E1A30',
    frameShadow: '#B8922A',
    frameInner: '#B8922A',
    viewportBorder: '#0E1A30',
    barBg: '#1E3E6A',
    barBorder: '#B8922A',
    btnBorder: '#0E1A30',
    btnActive: '#B8922A',
    btnInactive: '#7A6010',
    btnShadow: '#4A3808',
    btnText: '#F0E8D0',
    badgeBg: '#0E1A30',
    badgeText: '#B8922A',
  },
};

// ---------------------------------------------------------------------------
// Habitat preview card — universal, any pet can be displayed
// ---------------------------------------------------------------------------

function HabitatPreview({
  habitat,
  petKind,
  compact = false,
}: {
  habitat: HabitatDef;
  petKind: PetKind;
  compact?: boolean;
}) {
  const SceneComponent = HABITAT_SCENES[habitat.id];
  const petEntry = PETS.find((p) => p.kind === petKind) ?? PETS[0];
  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] border-4 border-[#074F9A] shadow-[0_6px_0_#074F9A] ${compact ? 'h-40' : 'h-64'}`}
      data-testid={`habitat-card-${habitat.id}`}
      style={{ background: `linear-gradient(to bottom, ${habitat.skyTop}, ${habitat.skyBottom})` }}
    >
      {/* Scene SVG fills the card */}
      {SceneComponent && <SceneComponent />}

      {/* Pet — centered on a quiet stage */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 kino-anim-idle drop-shadow-[0_4px_0_rgba(7,79,154,.35)]"
        aria-label={`${petEntry.name} in ${habitat.name}`}
      >
        <PetSprite kind={petKind} size={compact ? 'sm' : 'md'} label={petEntry.name} />
      </div>

      {/* Habitat name badge */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
        <span className="rounded-full bg-[#073B5C]/85 px-3 py-1 text-xs font-black text-white backdrop-blur-sm">
          {habitat.name}
        </span>
      </div>

      {/* Mood tag — top left */}
      <div className="absolute left-3 top-3">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
          style={{ backgroundColor: habitat.accentColor, border: '2px solid #074F9A' }}
        >
          {habitat.mood}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Care assets
// ---------------------------------------------------------------------------

function CareAsset({ kind, label, tone }: { kind: 'snack' | 'fruit' | 'bottle' | 'poop' | 'seed' | 'toy'; label: string; tone: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/50 p-4">
      <div className={`relative flex h-20 w-20 items-center justify-center rounded-2xl ${tone}`}>
        {kind === 'snack' && <div className="h-8 w-12 rotate-[-12deg] rounded-[45%] border-4 border-[#074F9A] bg-[#FFB14A] shadow-[inset_0_-7px_0_#EC7D50]"><span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[#FFE347]" /><span className="absolute right-3 top-4 h-2 w-2 rounded-full bg-[#FFE347]" /></div>}
        {kind === 'fruit' && <div className="relative h-10 w-10 rounded-full border-4 border-[#074F9A] bg-[#FF6A98] shadow-[8px_-6px_0_#FFC857]"><span className="absolute -right-1 -top-4 h-5 w-3 rotate-45 rounded-full border-4 border-[#074F9A] bg-[#67D279]" /></div>}
        {kind === 'bottle' && <div className="relative h-12 w-9 rounded-b-xl border-4 border-[#074F9A] bg-[#83DFF0]"><div className="absolute -top-3 left-1/2 h-4 w-4 -translate-x-1/2 rounded-t-md border-4 border-[#074F9A] bg-[#FFE347]" /><div className="absolute inset-x-2 top-4 h-1 rounded-full bg-white/80" /></div>}
        {kind === 'poop' && (
          <svg viewBox="0 0 80 80" className="h-16 w-16 overflow-visible" role="img" aria-label="Mess marker with odor accents">
            <circle cx="9" cy="28" r="4" fill="#B8CDED" />
            <circle cx="70" cy="18" r="5" fill="#B8CDED" />
            <circle cx="72" cy="48" r="3" fill="#9FB9E0" />
            <path d="M25 24c-5-6 5-9 0-16M40 22c-5-7 6-10 1-17M55 25c-6-6 5-10 0-16" fill="none" stroke="#074F9A" strokeWidth="5" strokeLinecap="round" />
            <path d="M29 43c-4-5-3-12 2-17 5-4 12-4 18-7 4-2 7 0 5 4-3 5-6 8-1 11 4 3 11 1 15 5 5 5 4 13-2 17 7 1 11 5 11 11 0 7-6 11-13 11H20C11 78 5 72 5 64c0-9 7-15 16-15h16c-3-1-6-3-8-6Z" fill="#E9773E" stroke="#074F9A" strokeWidth="5" strokeLinejoin="round" />
            <path d="M18 62c2-5 7-7 13-7h29" fill="none" stroke="#F6A064" strokeWidth="5" strokeLinecap="round" opacity=".9" />
            <path d="M36 31c4-3 8-3 12-5" fill="none" stroke="#FFB177" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
        {kind === 'seed' && <div className="relative h-12 w-10 rotate-[-18deg] rounded-[60%_40%_60%_40%] border-4 border-[#074F9A] bg-[#73C95D]"><span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[#FFE347]" /><div className="absolute -right-5 bottom-0 h-8 w-7 rotate-[38deg] rounded-full border-4 border-[#074F9A] bg-[#B6E56E]" /></div>}
        {kind === 'toy' && <div className="relative h-10 w-14 rounded-full border-4 border-[#074F9A] bg-[#FF86B8]"><div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#074F9A] bg-[#FFE347]" /><div className="absolute -top-4 left-2 h-5 w-5 rounded-full border-4 border-[#074F9A] bg-[#83DFF0]" /><div className="absolute -top-4 right-2 h-5 w-5 rounded-full border-4 border-[#074F9A] bg-[#73C95D]" /></div>}
      </div>
      <span className="text-center text-sm font-bold">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Egg widget (hero device)
// ---------------------------------------------------------------------------

const CRACKED_EGG_FRAME_CLIP = 'polygon(25% 6%, 33% 13%, 45% 0, 64% 14%, 88% 11%, 89% 29%, 100% 62%, 89% 67%, 91% 86%, 78% 96%, 58% 91%, 42% 100%, 31% 89%, 15% 97%, 12% 78%, 0 63%, 13% 42%, 9% 20%)';
const EGG_SHELL_DECOR_CLIP = 'polygon(50% 0, 35% 2%, 22% 12%, 13% 26%, 7% 43%, 4% 60%, 9% 79%, 20% 93%, 36% 99%, 50% 100%, 64% 99%, 80% 93%, 91% 79%, 96% 60%, 93% 43%, 87% 26%, 78% 12%, 65% 2%)';

const THEME_ORDER: EggThemeId[] = ['sprinkle', 'dino', 'zelda', 'astartes'];

const THEME_CAPTION: Record<EggThemeId, string> = {
  sprinkle: 'Rounded egg-shaped shell, sprinkle details, cracked-egg frame, square viewport, three-button control row.',
  dino:     'Primordial incubated shell with organic mossy spots and earthy speckling. Rustic brown frame, olive control row.',
  zelda:    'Enchanted forest-green relic with aged gold filigree, leaf vine accents, and triforce-adjacent triangular motif.',
  astartes: 'Compact ceremonial power-armor shell with deep blue ceramite, gold rivets, panel seams, and gothic winged badge.',
};

type EggEnclosureButtonId = 'care' | 'play' | 'map';

function EggEnclosureButton({
  id,
  label,
  selected,
  theme,
  onClick,
}: {
  id: EggEnclosureButtonId;
  label: string;
  selected: boolean;
  theme: EggTheme;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-egg-button={id}
      data-state={selected ? 'selected' : 'resting'}
      aria-pressed={selected}
      aria-label={`Egg enclosure button ${label}`}
      onClick={onClick}
      className={`h-12 w-12 rounded-full border-4 transition-[transform,box-shadow] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE347] active:translate-y-[5px] ${
        selected ? 'translate-y-[3px]' : ''
      }`}
      style={{
        borderColor: theme.btnBorder,
        background: selected ? theme.btnActive : theme.btnInactive,
        boxShadow: `0 ${selected ? 2 : 5}px 0 ${theme.btnShadow}`,
      }}
    >
      <span className="font-mono text-xs font-black" style={{ color: theme.btnText }}>
        {label}
      </span>
    </button>
  );
}

type EggMenuActionId = 'feed' | 'play' | 'medicine' | 'clean' | 'health' | 'discipline' | 'attention';

type EggMenuAction = {
  id: EggMenuActionId;
  label: string;
};

const EGG_MENU_TOP: EggMenuAction[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'play', label: 'Play' },
  { id: 'medicine', label: 'Medicine' },
];

const EGG_MENU_BOTTOM: EggMenuAction[] = [
  { id: 'clean', label: 'Clean' },
  { id: 'health', label: 'Health' },
  { id: 'discipline', label: 'Discipline' },
  { id: 'attention', label: 'Attention' },
];

type EggMenuPalette = {
  main: string;
  active: string;
  outline: string;
  highlight: string;
  accent: string;
  shadow: string;
};

const EGG_MENU_PALETTE: Record<EggMenuActionId, EggMenuPalette> = {
  feed: {
    main: '#F2A34A',
    active: '#FFC66D',
    outline: '#914719',
    highlight: '#FFE9B0',
    accent: '#E87932',
    shadow: '#7A3919',
  },
  play: {
    main: '#7769E5',
    active: '#9A8CFF',
    outline: '#302575',
    highlight: '#D0C9FF',
    accent: '#FFDB5C',
    shadow: '#342B7C',
  },
  medicine: {
    main: '#56C8D9',
    active: '#83E4ED',
    outline: '#14556F',
    highlight: '#E4FCFF',
    accent: '#F2646D',
    shadow: '#1B6A7B',
  },
  clean: {
    main: '#6DCFC4',
    active: '#94E8DE',
    outline: '#145B67',
    highlight: '#E3FFFA',
    accent: '#4FA7D1',
    shadow: '#206D75',
  },
  health: {
    main: '#ED6795',
    active: '#FF8FB2',
    outline: '#822143',
    highlight: '#FFD8E5',
    accent: '#FFB347',
    shadow: '#812B4E',
  },
  discipline: {
    main: '#E97057',
    active: '#FF9476',
    outline: '#782D26',
    highlight: '#FFD0B5',
    accent: '#FFE347',
    shadow: '#7F342B',
  },
  attention: {
    main: '#E9BC3D',
    active: '#FFD962',
    outline: '#765310',
    highlight: '#FFF5B7',
    accent: '#FF8745',
    shadow: '#76520F',
  },
};

function EggMenuGlyph({
  id,
  selected,
  theme,
}: {
  id: EggMenuActionId;
  selected: boolean;
  theme: EggTheme;
}) {
  const palette = EGG_MENU_PALETTE[id];
  const main = selected ? palette.active : palette.main;
  const outline = palette.outline;
  const highlight = palette.highlight;
  const accent = palette.accent;

  return (
    <svg
      viewBox="0 0 48 48"
      className="h-8 w-8 overflow-visible"
      aria-hidden="true"
      style={{
        filter: `drop-shadow(0 ${selected ? 1 : 3}px 0 ${palette.shadow}) drop-shadow(0 1px 1px ${theme.shellDropShadow}55)`,
      }}
    >
      {id === 'feed' && (
        <>
          {/* crossed fork and knife */}
          <path d="M13 10v10m4-10v10m-2-10v25" stroke={outline} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M11 10v6c0 3 2 4 4 4s4-1 4-4v-6" fill="none" stroke={highlight} strokeWidth="2" strokeLinecap="round" />
          <path d="m29 10-7 16m7-16c3 4 3 8 0 12l-4 4m4-16v25" fill="none" stroke={accent} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 36h18" stroke={main} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {id === 'play' && (
        <>
          {/* baseball and bat */}
          <path d="m12 34 23-23" stroke={outline} strokeWidth="5" strokeLinecap="round" />
          <path d="m12 34 23-23" stroke={highlight} strokeWidth="2.7" strokeLinecap="round" />
          <path d="m10 36 4-4" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <circle cx="17" cy="16" r="9" fill={main} stroke={outline} strokeWidth="2.5" />
          <path d="M11 12c3 1 5 3 6 6m-5 3c3-1 5-3 6-6m1-5c-1 3-1 6 1 9m-8-5c3-1 6-1 9 1" fill="none" stroke={highlight} strokeWidth="1.4" strokeLinecap="round" opacity=".9" />
        </>
      )}
      {id === 'medicine' && (
        <>
          {/* syringe */}
          <path d="M14 33 31 16l5 5-17 17-5-5Z" fill={main} stroke={outline} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="m28 13 7 7m-2-10 7 7m-5-4 4-4" stroke={highlight} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 35 8 39m5-1-4 4" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <path d="m20 27 5 5m-2-12 5 5" stroke={highlight} strokeWidth="1.8" strokeLinecap="round" opacity=".85" />
          <path d="M17 21 28 32" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity=".9" />
        </>
      )}
      {id === 'clean' && (
        <>
          {/* toilet-paper roll */}
          <path d="M12 17c0-4 4-7 10-7h9v20c0 4-4 7-9 7h-9V17Z" fill={main} stroke={outline} strokeWidth="2.5" strokeLinejoin="round" />
          <ellipse cx="22" cy="17" rx="10" ry="7" fill={highlight} stroke={outline} strokeWidth="2.5" />
          <ellipse cx="22" cy="17" rx="4" ry="2.8" fill={accent} stroke={outline} strokeWidth="1.8" />
          <path d="M22 24c4 1 7 3 9 6v7" fill="none" stroke={highlight} strokeWidth="2" strokeLinecap="round" />
          <path d="M13 27h7m-7 5h6" stroke={accent} strokeWidth="1.8" strokeLinecap="round" opacity=".9" />
        </>
      )}
      {id === 'health' && (
        <>
          {/* heart monitor */}
          <path d="M24 38S9 29 9 19c0-5 7-8 11-3l4 4 4-4c4-5 11-2 11 3 0 10-15 19-15 19Z" fill={main} stroke={outline} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M13 23h6l2-5 3 10 3-6h7" fill="none" stroke={highlight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="37" r="1.7" fill={accent} />
        </>
      )}
      {id === 'discipline' && (
        <>
          {/* whistle */}
          <path d="M12 22h18c5 0 8 3 8 7s-3 7-8 7h-4v-7H12c-4 0-6-3-6-7s2-7 6-7h8v7Z" fill={main} stroke={outline} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="30" cy="29" r="3" fill={accent} stroke={outline} strokeWidth="1.8" />
          <path d="M12 15v-4m-4 6-3-3m9 1 2-4" stroke={highlight} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {id === 'attention' && (
        <>
          {/* bell */}
          <path d="M14 31h20l-3-5V20c0-5-3-8-7-8s-7 3-7 8v6l-3 5Z" fill={main} stroke={outline} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M11 32h26" stroke={highlight} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M21 36c1 2 5 2 6 0" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M24 9V6m-9 5-2-2m18 2 2-2" stroke={highlight} strokeWidth="2" strokeLinecap="round" opacity=".85" />
        </>
      )}
    </svg>
  );
}

function EggMenuIcon({
  action,
  selected,
  theme,
  onClick,
}: {
  action: EggMenuAction;
  selected: boolean;
  theme: EggTheme;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-egg-menu={action.id}
      data-state={selected ? 'selected' : 'resting'}
      aria-pressed={selected}
      aria-label={`Egg enclosure menu: ${action.label}`}
      title={action.label}
      onClick={onClick}
      className={`kino-egg-menu-button relative flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 transition-[transform,filter] duration-150 ease-out focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#FFE347] active:translate-y-[3px] ${
        selected ? 'kino-egg-menu-selected' : ''
      }`}
      style={{
        transform: selected ? 'translateY(2px) scale(1.14)' : undefined,
      }}
    >
      <EggMenuGlyph id={action.id} selected={selected} theme={theme} />
    </button>
  );
}

function EggWidget() {
  const [active, setActive] = useState<EggEnclosureButtonId>('care');
  const [selectedMenu, setSelectedMenu] = useState<EggMenuActionId>('feed');
  const [themeId, setThemeId] = useState<EggThemeId>('sprinkle');
  const t = EGG_THEMES[themeId];
  const { ShellDecor } = t;

  return (
    <div className="mx-auto w-full max-w-[370px]">
      {/* ── Theme selector ── */}
      <div className="mb-4 flex items-center justify-center gap-1.5 flex-wrap" role="group" aria-label="Egg shell theme">
        {THEME_ORDER.map((id) => {
          const th = EGG_THEMES[id];
          const isActive = id === themeId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setThemeId(id)}
              aria-pressed={isActive}
              className={[
                'rounded-full px-3 py-1 text-xs font-black transition-all border-2',
                isActive
                  ? 'scale-105 border-[#FFE347] bg-[#073B5C] text-white shadow-[0_3px_0_#FFE347]'
                  : 'border-border bg-card text-muted-foreground hover:border-[#074F9A] hover:text-foreground',
              ].join(' ')}
            >
              <span
                className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border border-current align-[-1px]"
                style={{ background: th.shellGradient.stops[1]?.color ?? th.shellStroke }}
                aria-hidden="true"
              />
              {th.label}
            </button>
          );
        })}
      </div>

      <div className="relative aspect-[5/6] w-full">
        {/* Shell SVG */}
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          style={{ filter: `drop-shadow(0 16px 0 ${t.shellDropShadow}) drop-shadow(0 24px 30px rgba(7,59,92,.25))` }}
          viewBox="0 0 100 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={t.shellGradient.id} x1="0" y1="0" x2="1" y2="1">
              {t.shellGradient.stops.map((s) => (
                <stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
          </defs>
          <path
            d="M50 1C33 1 21 13 13 31C5 49 3 70 9 88C15 107 30 118 50 119C70 118 85 107 91 88C97 70 95 49 87 31C79 13 67 1 50 1Z"
            fill={`url(#${t.shellGradient.id})`}
            stroke={t.shellStroke}
            strokeWidth="2.2"
          />
        </svg>

        {/* Surface decoration layer */}
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: EGG_SHELL_DECOR_CLIP }} aria-hidden="true">
          <ShellDecor />
        </div>

        {/* Logo */}
        <div className="absolute left-1/2 top-[13%] -translate-x-1/2 text-[10px] font-black tracking-[0.12em]" style={{ color: t.logoColor }}>KINOTCHI</div>

        {/* Cracked-egg frame */}
        <div
          className="absolute left-1/2 top-[20%] aspect-[1.05] w-[74%] -translate-x-1/2"
          style={{
            background: t.frameOuter,
            clipPath: CRACKED_EGG_FRAME_CLIP,
            filter: `drop-shadow(0 5px 0 ${t.frameShadow})`,
          }}
        >
          <div
            className="absolute inset-[3px]"
            style={{ background: t.frameInner, clipPath: CRACKED_EGG_FRAME_CLIP }}
          />

          {/* Square viewport */}
          <div
            className="absolute left-1/2 top-1/2 aspect-square w-[70%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[0.5rem] bg-gradient-to-b from-[#BDF3E7] via-[#F7D7DB] to-[#B8DDE7]"
            style={{ border: `4px solid ${t.viewportBorder}` }}
          >
            {/* Top HUD bar — Feed, Play, Medicine */}
            <div
              className="absolute inset-x-0 top-0 flex h-[22%] items-center justify-around px-2"
              style={{
                background: t.barBg,
                borderBottom: `2px solid ${t.barBorder}`,
              }}
            >
              {EGG_MENU_TOP.map((action) => (
                <EggMenuIcon
                  key={action.id}
                  action={action}
                  selected={selectedMenu === action.id}
                  theme={t}
                  onClick={() => setSelectedMenu(action.id)}
                />
              ))}
            </div>

            {/* Habitat + pet */}
            <div className="absolute inset-x-0 top-[22%] bottom-[20%] overflow-hidden" aria-label="Austin Pennybacker Bridge habitat">
              <HabitatScene_Austin />
              <div className="absolute bottom-[7%] left-1/2 -translate-x-1/2 drop-shadow-[0_2px_0_rgba(7,79,154,.45)]">
                <PetSprite kind="blubkin" size="sm" label="Blubkin in the Austin habitat" />
              </div>
            </div>

            {/* Bottom HUD bar — Clean, Health, Discipline, Attention */}
            <div
              className="absolute inset-x-0 bottom-0 flex h-[20%] items-center justify-around px-2"
              style={{
                background: t.barBg,
                borderTop: `2px solid ${t.barBorder}`,
              }}
            >
              {EGG_MENU_BOTTOM.map((action) => (
                <EggMenuIcon
                  key={action.id}
                  action={action}
                  selected={selectedMenu === action.id}
                  theme={t}
                  onClick={() => setSelectedMenu(action.id)}
                />
              ))}
            </div>

            {/* Day badge */}
            <div
              className="absolute left-[11%] top-[23%] rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
              style={{ background: t.badgeBg, color: t.badgeText }}
            >
              DAY 04
            </div>
          </div>
        </div>

        {/* A / B / C buttons */}
        <div className="absolute bottom-[9%] left-1/2 flex -translate-x-1/2 items-center gap-6">
          {(['care', 'play', 'map'] as const).map((button) => (
            <EggEnclosureButton
              key={button}
              id={button}
              label={button === 'care' ? 'A' : button === 'play' ? 'B' : 'C'}
              selected={active === button}
              theme={t}
              onClick={() => setActive(button)}
            />
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">{THEME_CAPTION[themeId]}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAGES
// ---------------------------------------------------------------------------

export function KinotchiOverviewPage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border-4 border-[#074F9A] bg-gradient-to-br from-[#073B5C] via-[#0A58CA] to-[#FF5D8F] p-6 text-white shadow-[0_10px_0_#FFCF2E] sm:p-8">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #FFE347 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#FFE347]">The Kinotchi world</p>
            <h2 className="mt-3 max-w-xl text-4xl font-black leading-tight sm:text-5xl">Small screen. Big habitat.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/85">A visual system for a desktop widget that feels like a pocket arcade cabinet: tactile, colorful, and alive with creatures that grow into new forms.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#FFE347] px-3 py-1 text-xs font-black text-[#073B5C]">Square viewport</span>
              <span className="rounded-full bg-[#FF86B8] px-3 py-1 text-xs font-black text-[#073B5C]">Three buttons</span>
              <span className="rounded-full bg-[#83DFF0] px-3 py-1 text-xs font-black text-[#073B5C]">Living worlds</span>
            </div>
          </div>
          <EggWidget />
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['01', 'Playful contrast', 'Deep ocean outlines keep candy colors readable at widget scale.'],
          ['02', 'Pixel memory', 'Use square framing, tiny marks, and stepped silhouettes to imply a digital toy.'],
          ['03', 'Care is visible', 'Every state gets a small visual cue: appetite, mood, sleep, mess, or discovery.'],
        ].map(([number, title, copy]) => (
          <div key={number} className="rounded-2xl border-2 bg-card p-5 text-card-foreground">
            <p className="font-mono text-xs font-black text-primary">{number}</p>
            <h3 className="mt-3 font-black">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <h2 className="font-black">Source-derived composition rules</h2>
        <div className="mt-4">
          <Guidelines items={[
            { kind: 'do', text: 'Pair deep blue outlines with one bright candy accent and one soft habitat color.' },
            { kind: 'do', text: 'Keep the pet silhouette and face legible before adding environmental detail.' },
            { kind: 'do', text: 'Use high-energy gradients for discovery moments and calmer fields for care moments.' },
            { kind: 'dont', text: 'Do not let texture, stars, or decorative particles compete with the pet.' },
          ]} />
        </div>
      </section>
    </div>
  );
}

export function HabitatsPage() {
  const [selectedPetKind, setSelectedPetKind] = useState<PetKind>('nubbin');

  const selectedPet = PETS.find((p) => p.kind === selectedPetKind) ?? PETS[0];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-black">Universal habitats</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              Every habitat is open to every Kinotchi. No pet is assigned to an environment by branch.
              Choose any creature below to preview it across all ten settings.
            </p>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">
            10 environments
          </span>
        </div>

        {/* Pet selector */}
        <div className="mt-5">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
            Preview with pet
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Select a pet to preview in habitats"
            data-testid="habitat-pet-selector"
          >
            {PETS.map((pet) => {
              const isSelected = pet.kind === selectedPetKind;
              return (
                <button
                  key={pet.kind}
                  type="button"
                  onClick={() => setSelectedPetKind(pet.kind)}
                  aria-pressed={isSelected}
                  data-testid={`pet-selector-btn-${pet.kind}`}
                  className={[
                    'flex items-center gap-2 rounded-2xl border-2 px-3 py-1.5 text-xs font-black transition-all',
                    'hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? 'border-[#074F9A] bg-[#074F9A] text-white shadow-[0_3px_0_rgba(7,29,80,.5)]'
                      : 'border-border bg-card text-foreground hover:border-[#074F9A]/60',
                  ].join(' ')}
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-xl" aria-hidden="true">
                    <svg viewBox="0 0 120 120" className="h-7 w-7">
                      {pet.kind === 'nubbin' && <NubbinSprite sw={5.5} />}
                      {pet.kind === 'twiglet' && <TwigletSprite sw={5.5} />}
                      {pet.kind === 'pebblur' && <PebblurSprite sw={5.5} />}
                      {pet.kind === 'thornlet' && <ThornletSprite sw={5.5} />}
                      {pet.kind === 'mosswick' && <MosswickSprite sw={5.5} />}
                      {pet.kind === 'bramblox' && <BrambloxSprite sw={5.5} />}
                      {pet.kind === 'fernwing' && <FernwingSprite sw={5.5} />}
                      {pet.kind === 'gloomoak' && <GloomoakSprite sw={5.5} />}
                      {pet.kind === 'blubkin' && <BlubkinSprite sw={5.5} />}
                      {pet.kind === 'splotch' && <SplotchSprite sw={5.5} />}
                      {pet.kind === 'gillby' && <GillbySprite sw={5.5} />}
                      {pet.kind === 'coraloom' && <CoraloomSprite sw={5.5} />}
                      {pet.kind === 'driftmaw' && <DriftmawSprite sw={5.5} />}
                      {pet.kind === 'inkwhirl' && <InkwhirlSprite sw={5.5} />}
                      {pet.kind === 'abyssling' && <AbysslingSprite sw={5.5} />}
                      {pet.kind === 'pufflet' && <PuffletSprite sw={5.5} />}
                      {pet.kind === 'driftoo' && <DriftooSprite sw={5.5} />}
                      {pet.kind === 'stormite' && <StormiteSprite sw={5.5} />}
                      {pet.kind === 'cumulus' && <CumulusSprite sw={5.5} />}
                      {pet.kind === 'sparkave' && <SparkaveSprite sw={5.5} />}
                      {pet.kind === 'mistveil' && <MistveilSprite sw={5.5} />}
                      {pet.kind === 'tempestri' && <TempestriSprite sw={5.5} />}
                    </svg>
                  </span>
                  {pet.name}
                </button>
              );
            })}
          </div>

          {/* Selected pet info strip */}
          <div
            className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-[#074F9A]/30 bg-muted/50 px-4 py-2"
            data-testid="habitat-selected-pet-info"
          >
            <div className="flex-shrink-0 overflow-hidden rounded-xl">
              <PetSprite kind={selectedPetKind} size="sm" label={selectedPet.name} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-primary">{selectedPet.stage}</p>
              <p className="text-sm font-black">{selectedPet.name}</p>
              <p className="truncate text-xs text-muted-foreground">{selectedPet.detail}</p>
            </div>
            <p className="ml-auto flex-shrink-0 text-xs text-muted-foreground">
              visits all 10 habitats
            </p>
          </div>
        </div>
      </section>

      {/* Habitat grid */}
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        data-testid="habitat-grid"
      >
        {HABITATS.map((habitat) => (
          <HabitatPreview
            key={habitat.id}
            habitat={habitat}
            petKind={selectedPetKind}
          />
        ))}
      </div>

      {/* Habitat composition recipe */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <h2 className="font-black">Habitat composition recipe</h2>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <p>
            <span className="font-bold text-foreground">Scene:</span> one landmark or environmental cue makes each setting instantly recognizable at widget scale.
          </p>
          <p>
            <span className="font-bold text-foreground">Stage:</span> a quiet central region lets the pet and its action state remain the clear focal point.
          </p>
          <p>
            <span className="font-bold text-foreground">Restraint:</span> thick outlines, simple fills, and no competing texture keep the pet legible at any size.
          </p>
        </div>
        <div className="mt-5">
          <Guidelines items={[
            { kind: 'do', text: 'Give every habitat one instantly recognizable landmark: a bridge, a dome, a mountain, a rocket.' },
            { kind: 'do', text: 'Keep the center-bottom clear so any pet silhouette reads without overlap.' },
            { kind: 'do', text: 'Use the same thick #074F9A outline weight on habitat elements as on pet sprites.' },
            { kind: 'dont', text: 'Do not infer a pet branch from a habitat setting or pre-assign pets to environments.' },
            { kind: 'dont', text: 'Do not crowd the scene with so much detail that the pet becomes secondary.' },
          ]} />
        </div>
      </section>

      {/* Universality note */}
      <div className="rounded-xl bg-[#073B5C] p-5 text-sm text-white">
        <span className="font-black text-[#FFE347]">Core rule: </span>
        Habitats are neutral stages. Any Kinotchi may visit any habitat regardless of its growth branch.
        A Gloomoak is just as at home on a sunny beach as in a spooky cemetery — and that is the whole idea.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PetsPage
// ---------------------------------------------------------------------------

export function PetsPage() {
  const branchColors: Record<Branch | 'universal', { bg: string; label: string; text: string }> = {
    universal: { bg: 'bg-[#FFF4BE]',  label: 'bg-[#FFD84A]',  text: 'text-[#5A3800]' },
    grove:     { bg: 'bg-[#D7F3B9]',  label: 'bg-[#73C95D]',  text: 'text-[#1A4A08]' },
    tide:      { bg: 'bg-[#C4F5FA]',  label: 'bg-[#50D7E3]',  text: 'text-[#073B5C]' },
    zephyr:    { bg: 'bg-[#E6E4FF]',  label: 'bg-[#B8B8F8]',  text: 'text-[#2A1F6A]' },
  };

  return (
    <div className="space-y-6">
      {/* Taxonomy overview strip */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-black">Three families, one origin</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every Kinotchi starts as a Nubbin and grows into Grove, Tide, or Zephyr based on how it is cared for. All pets can visit any habitat.</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">22 original creatures</span>
        </div>

        {/* Baby row */}
        <div className="mt-6 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl border-2 border-dashed border-[#FFD84A] bg-[#FFF4BE] p-3">
              <PetSprite kind="nubbin" size="md" label="Nubbin" />
            </div>
            <span className="text-sm font-black">Nubbin</span>
            <span className="rounded-full bg-[#FFD84A] px-2 py-0.5 text-xs font-bold text-[#5A3800]">Baby</span>
          </div>
        </div>

        {/* Branch columns */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {([ 'grove', 'tide', 'zephyr' ] as Branch[]).map((branch) => {
            const bc = branchColors[branch];
            const branchPets = PETS.filter((p) => p.branch === branch);
            const branchLabel = branch === 'grove' ? 'Grove Branch' : branch === 'tide' ? 'Tide Branch' : 'Zephyr Branch';
            return (
              <div key={branch} className={`rounded-2xl border-2 p-4 ${bc.bg}`}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black ${bc.label} ${bc.text}`}>{branchLabel}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {branchPets.map((pet) => (
                    <div key={pet.name} className="flex flex-col items-center gap-1">
                      <PetSprite kind={pet.kind} size="sm" label={pet.name} />
                      <span className="text-xs font-black">{pet.name}</span>
                      <span className="text-center text-[10px] leading-tight text-muted-foreground">{pet.stage.replace(`${branch.charAt(0).toUpperCase() + branch.slice(1)} `, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detail cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PETS.map((pet) => {
          const bc = branchColors[pet.branch];
          return (
            <div key={pet.name} className="flex items-center gap-4 rounded-2xl border-2 bg-card p-4 text-card-foreground">
              <div className={`flex-shrink-0 rounded-2xl p-2 ${bc.bg}`}><PetSprite kind={pet.kind} size="md" label={pet.name} /></div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">{pet.stage}</p>
                <h3 className="mt-0.5 text-lg font-black">{pet.name}</h3>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{pet.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Construction note */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <h2 className="font-black">Pet construction</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Progression comes from silhouette changes, not just color swaps. Each stage adds a body proportion, appendage, prop, or habitat cue while keeping the face recognizable.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {['new silhouette', 'signature appendage', 'stage marking', 'rare transformation', 'care-driven branching'].map((item) => (
            <span key={item} className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{item}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EvolutionPage — three-branch chart
// ---------------------------------------------------------------------------

type EvoBranch = {
  id: Branch;
  label: string;
  condition: string;
  young: { kind: PetKind; name: string; note: string }[];
  mature: { kind: PetKind; name: string; note: string; path: string }[];
  rare: { kind: PetKind; name: string; note: string };
  headerBg: string;
  headerText: string;
  rowBg: string;
  accent: string;
};

const EVO_BRANCHES: EvoBranch[] = [
  {
    id: 'grove',
    label: 'Grove Branch',
    condition: 'Feed seeds, play with soil-based toys, keep energy high during daylight',
    young: [
      { kind: 'twiglet',  name: 'Twiglet',  note: 'Care: frequent daylight play' },
      { kind: 'pebblur',  name: 'Pebblur',  note: 'Care: long rests after seed meals' },
      { kind: 'thornlet', name: 'Thornlet',  note: 'Care: high energy with brief cleanup delays' },
    ],
    mature: [
      { kind: 'mosswick', name: 'Mosswick', note: 'A quiet, moss-crowned guardian', path: 'Twiglet + frequent rests' },
      { kind: 'bramblox', name: 'Bramblox', note: 'A bold bramble-rolling protector', path: 'Pebblur + high play, low hunger' },
      { kind: 'fernwing', name: 'Fernwing', note: 'A swift canopy glider', path: 'Thornlet + max seeds, balanced care' },
    ],
    rare: { kind: 'gloomoak', name: 'Gloomoak', note: 'Any Grove mature + full care through a complete night cycle' },
    headerBg: '#3D7A2B',
    headerText: '#D7F3B9',
    rowBg: '#EAF8D0',
    accent: '#73C95D',
  },
  {
    id: 'tide',
    label: 'Tide Branch',
    condition: 'Use bubble tonics, keep clean, play in water after meals',
    young: [
      { kind: 'blubkin',  name: 'Blubkin',  note: 'Care: clean habitat with small meals' },
      { kind: 'splotch',  name: 'Splotch',  note: 'Care: messy feeding with frequent water play' },
      { kind: 'gillby',   name: 'Gillby',   note: 'Care: fast-current exploration after meals' },
    ],
    mature: [
      { kind: 'coraloom', name: 'Coraloom', note: 'A proud, reef-crowned caretaker', path: 'Blubkin + bubble tonics, daily cleanup' },
      { kind: 'driftmaw', name: 'Driftmaw', note: 'A broad-winged current rider', path: 'Splotch + high activity, big appetite' },
      { kind: 'inkwhirl', name: 'Inkwhirl', note: 'A star-scribbling deep thinker', path: 'Gillby + tonic-heavy puzzle play' },
    ],
    rare: { kind: 'abyssling', name: 'Abyssling', note: 'Any Tide mature + maximum cleanliness through a full midnight care cycle' },
    headerBg: '#0A58CA',
    headerText: '#C4F5FA',
    rowBg: '#DBF5FD',
    accent: '#50D7E3',
  },
  {
    id: 'zephyr',
    label: 'Zephyr Branch',
    condition: 'Prioritize rest, let the pet drift and sleep through night cycles',
    young: [
      { kind: 'pufflet',  name: 'Pufflet',  note: 'Care: long, uninterrupted sleep cycles' },
      { kind: 'driftoo',  name: 'Driftoo',  note: 'Care: low activity with airy exploration' },
      { kind: 'stormite', name: 'Stormite', note: 'Care: short rests with high snack energy' },
    ],
    mature: [
      { kind: 'cumulus',  name: 'Cumulus',  note: 'A calm, wide-bodied cloud keeper', path: 'Pufflet + maximum rest, low play' },
      { kind: 'mistveil', name: 'Mistveil', note: 'A quiet cloak of evening mist', path: 'Driftoo + dusk exploration, balanced care' },
      { kind: 'sparkave', name: 'Sparkave', note: 'An energetic static-winged flier', path: 'Stormite + active play, snack energy' },
    ],
    rare: { kind: 'tempestri', name: 'Tempestri', note: 'Any Zephyr mature + full-cycle perfect care at dusk' },
    headerBg: '#5E4FD6',
    headerText: '#E6E4FF',
    rowBg: '#EFEDFF',
    accent: '#B8B8F8',
  },
];

export function EvolutionPage() {
  return (
    <div className="space-y-6">
      {/* Top strip: one baby, three arrows */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-black">Kinotchi growth chart</h2>
            <p className="mt-1 text-sm text-muted-foreground">One baby. Three care branches. Twelve distinct outcomes shaped by how you raise them.</p>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">3 branches, 12 outcomes</span>
        </div>

        {/* Baby + branch arrows */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl border-4 border-dashed border-[#FFD84A] bg-[#FFF4BE] p-3">
              <PetSprite kind="nubbin" size="lg" label="Nubbin — the universal baby" />
            </div>
            <span className="text-base font-black">Nubbin</span>
            <span className="text-sm text-muted-foreground">The universal baby stage</span>
          </div>
          {/* Branch arrows row */}
          <div className="grid w-full max-w-2xl grid-cols-3 gap-2 text-center">
            {EVO_BRANCHES.map((branch) => (
              <div key={branch.id} className="flex flex-col items-center gap-1">
                <div className="text-2xl font-black" style={{ color: branch.accent }}>↓</div>
                <span className="rounded-full px-2 py-0.5 text-xs font-black text-white" style={{ backgroundColor: branch.headerBg }}>{branch.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Branch charts */}
      {EVO_BRANCHES.map((branch) => (
        <section key={branch.id} className="overflow-hidden rounded-2xl border-2 text-card-foreground" style={{ borderColor: branch.accent }}>
          {/* Header */}
          <div className="px-6 py-4" style={{ backgroundColor: branch.headerBg }}>
            <h3 className="text-lg font-black" style={{ color: branch.headerText }}>{branch.label}</h3>
            <p className="mt-1 text-sm" style={{ color: branch.headerText, opacity: 0.85 }}>
              <span className="font-bold">Condition: </span>{branch.condition}
            </p>
          </div>

          <div className="p-6" style={{ backgroundColor: branch.rowBg }}>
            {/* Young forms */}
            <div className="mb-5">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Young forms · care condition</p>
              <div className="grid grid-cols-3 gap-3">
                {branch.young.map((y) => (
                  <div key={y.kind} className="flex flex-col items-center gap-2 rounded-2xl border-2 border-white bg-white/70 p-3">
                    <PetSprite kind={y.kind} size="md" label={y.name} />
                    <span className="text-sm font-black">{y.name}</span>
                    <span className="text-center text-xs leading-tight text-muted-foreground">{y.note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* One explicit care path per aligned column */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              {branch.mature.map((m) => (
                <div key={`${m.kind}-path`} className="flex flex-col items-center gap-1 text-center">
                  <span className="text-xl font-black leading-none" style={{ color: branch.headerBg }}>↓</span>
                  <span className="rounded-full px-3 py-1 text-[11px] font-black text-white" style={{ backgroundColor: branch.headerBg }}>{m.path}</span>
                </div>
              ))}
            </div>

            {/* Mature forms */}
            <div className="mb-5">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Mature forms · aligned to the path above</p>
              <div className="grid grid-cols-3 gap-3">
                {branch.mature.map((m) => (
                  <div key={m.kind} className="flex flex-col items-center gap-2 rounded-2xl border-2 bg-white/80 p-3" style={{ borderColor: branch.accent }}>
                    <PetSprite kind={m.kind} size="md" label={m.name} />
                    <span className="text-sm font-black">{m.name}</span>
                    <span className="text-center text-xs leading-tight text-muted-foreground">{m.note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rare form */}
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Rare Form</p>
              <div className="flex items-center gap-5 rounded-2xl border-2 border-[#FFD84A] bg-[#073B5C] p-4">
                <PetSprite kind={branch.rare.kind} size="lg" label={branch.rare.name} />
                <div>
                  <span className="rounded-full bg-[#FFD84A] px-2 py-0.5 text-xs font-black text-[#5A3800]">Rare Discovery</span>
                  <p className="mt-2 text-lg font-black text-white">{branch.rare.name}</p>
                  <p className="mt-1 text-sm text-white/75">{branch.rare.note}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Rule callout */}
      <div className="rounded-xl bg-[#073B5C] p-5 text-sm text-white">
        <span className="font-black text-[#FFE347]">Core rule: </span>
        Every evolution must be explainable as a visible consequence of how the creature was cared for. Branch, young form, and mature outcome should form a readable story.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CareAssetsPage / MotionPage — unchanged structure
// ---------------------------------------------------------------------------

export function CareAssetsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <CareAsset kind="snack" label="Sun snack"    tone="bg-[#FFF0B0]" />
        <CareAsset kind="fruit" label="Berry fruit"  tone="bg-[#FFD7E9]" />
        <CareAsset kind="bottle" label="Bubble tonic" tone="bg-[#C4F5FA]" />
        <CareAsset kind="poop"  label="Mess marker"  tone="bg-[#EED8C6]" />
        <CareAsset kind="seed"  label="Habitat seed" tone="bg-[#D7F3B9]" />
        <CareAsset kind="toy"   label="Orbit toy"    tone="bg-[#D8D3FF]" />
      </div>
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <h2 className="font-black">Care asset language</h2>
        <div className="mt-4 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <p><span className="font-bold text-foreground">Readable:</span> props should be identifiable in a tiny square without relying on text.</p>
          <p><span className="font-bold text-foreground">Tactile:</span> use thick outlines, simple fills, and one highlight to make items feel collectible.</p>
          <p><span className="font-bold text-foreground">Kind:</span> mess markers can be funny and clear without feeling punitive.</p>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// useEatingFaceVisible — tracks whether the EatingFace should be mounted.
//
// While active (bodyState === 'eating') and motion is allowed, it runs a
// 4.2 s countdown (3 × 1.4 s = 3 full bite cycles).  When the countdown
// expires EatingFace unmounts and the pet returns to its normal default face
// while the CSS body animation continues its kino-idle-loop.
//
// Pause/resume accurately tracks remaining time so resume is seamless.
// Replay (new replayKey) resets the full 4.2 s sequence from the start.
// When reducedMotion is true the countdown never runs — the static chewing
// pose stays visible indefinitely as the fallback representation of Eating.
// When active is false (state switched away from eating) the face hides
// immediately regardless of remaining time.
// ---------------------------------------------------------------------------
function useEatingFaceVisible({
  active,
  paused,
  reducedMotion,
  replayKey,
  totalMs = 4200,
}: {
  active: boolean;
  paused: boolean;
  reducedMotion: boolean;
  replayKey: number;
  totalMs?: number;
}): boolean {
  const [visible, setVisible] = useState<boolean>(active);

  // Track how many ms are left in the countdown so pause/resume is accurate.
  const remainingRef = useRef<number>(totalMs);
  // Wall-clock time when the current timer segment started.
  const startedAtRef = useRef<number | null>(null);
  // Current active timeout id.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Reset everything whenever active state changes or replay fires.
  useEffect(() => {
    clearTimer();
    if (!active) {
      setVisible(false);
      return;
    }
    // Entering eating state: show face and reset countdown.
    setVisible(true);
    remainingRef.current = totalMs;
    startedAtRef.current = null;
    // Timer will be started by the paused/reducedMotion effect below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, replayKey, totalMs]);

  // Start / stop the countdown timer based on paused + reducedMotion.
  useEffect(() => {
    if (!active) return;

    if (paused || reducedMotion) {
      // Save elapsed time so resume knows where to pick up from.
      if (startedAtRef.current !== null) {
        const elapsed = performance.now() - startedAtRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        startedAtRef.current = null;
      }
      clearTimer();
      return;
    }

    // Running: start a timer for the remaining duration.
    startedAtRef.current = performance.now();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      startedAtRef.current = null;
      remainingRef.current = 0;
      setVisible(false);
    }, remainingRef.current);

    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused, reducedMotion, replayKey]);

  return visible;
}

// ---------------------------------------------------------------------------
// MotionPage — sprite animation system catalog
// ---------------------------------------------------------------------------

type BodyState = 'idle' | 'eating' | 'playing';
type AnimKey = BodyState | EmotionKind | 'none';

// Which pet to animate in each section
const ANIM_PETS: { kind: PetKind; label: string; branch: Branch | 'universal'; bg: string }[] = [
  { kind: 'nubbin',  label: 'Nubbin',  branch: 'universal', bg: '#FFF4BE' },
  { kind: 'twiglet', label: 'Twiglet', branch: 'grove',     bg: '#D7F3B9' },
  { kind: 'blubkin', label: 'Blubkin', branch: 'tide',      bg: '#C4F5FA' },
  { kind: 'pufflet', label: 'Pufflet', branch: 'zephyr',    bg: '#E6E4FF' },
];

// Emotion animation class map
function emotionAnimClass(kind: EmotionKind): string {
  const map: Record<EmotionKind, string> = {
    content: 'kino-em-content',
    happy:   'kino-em-happy',
    excited: 'kino-em-excited',
    sad:     'kino-em-sad',
    angry:   'kino-em-angry',
    sick:    'kino-em-sick',
    hungry:  'kino-em-hungry',
    loved:   'kino-em-loved',
    sleepy:  'kino-em-sleepy',
    scared:  'kino-em-scared',
    bored:   'kino-em-bored',
    numb:    'kino-em-numb',
  };
  return map[kind];
}

// Body animation class map
function bodyAnimClass(state: BodyState): string {
  return state === 'idle' ? 'kino-anim-idle' : state === 'eating' ? 'kino-anim-eat' : 'kino-anim-play';
}

// A pet rendered with a body-state animation.
// The animation class stays mounted at all times; pause only toggles play-state.
// Replay is triggered by changing `replayKey` which remounts the wrapper div.
// When bodyState === 'eating', the EatingFace is shown for exactly 4.2 s (3 bites)
// then unmounts so the default face returns while the body idles on.
function AnimatedPetSprite({
  kind,
  label,
  bg,
  bodyState,
  paused,
  reducedMotion,
  replayKey,
}: {
  kind: PetKind;
  label: string;
  bg: string;
  bodyState: BodyState;
  paused: boolean;
  reducedMotion: boolean;
  replayKey: number;
}) {
  const animClass = bodyAnimClass(bodyState);
  const playState = paused ? 'paused' : 'running';

  // EatingFace is visible for 3 bite cycles (4.2 s), then unmounts.
  // Pause suspends the countdown; reducedMotion keeps it visible indefinitely.
  const showEatingFace = useEatingFaceVisible({
    active: bodyState === 'eating',
    paused,
    reducedMotion,
    replayKey,
  });

  return (
    <div
      className="flex flex-col items-center gap-2"
      data-testid={`body-anim-${kind}`}
    >
      <div
        className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border p-3"
        style={{ backgroundColor: bg }}
      >
        {/* key remounts on replay; animation class always present so pause/resume
            toggles play-state without removing the animation */}
        <div
          key={replayKey}
          className={animClass}
          style={{ animationPlayState: playState, transformOrigin: 'center bottom' }}
          aria-label={`${label} ${bodyState} animation`}
        >
          <PetSprite
            kind={kind}
            size="md"
            label={label}
            eatingFace={showEatingFace}
            eatingPlayState={playState}
          />
        </div>
      </div>
      <span className="text-xs font-black">{label}</span>
    </div>
  );
}

// Emotion-animated pet composite — body stays still, only the face <g> animates.
// The emotion animation class and play-state are forwarded into PetSprite's face group.
function AnimatedEmotionPet({
  petKind,
  petLabel,
  bg,
  emotionKind,
  paused,
  replayKey,
}: {
  petKind: PetKind;
  petLabel: string;
  bg: string;
  emotionKind: EmotionKind;
  paused: boolean;
  replayKey: number;
}) {
  const emClass = emotionAnimClass(emotionKind);
  const playState = paused ? 'paused' : 'running';
  return (
    <div
      className="flex flex-col items-center gap-2"
      data-testid={`emotion-anim-${petKind}-${emotionKind}`}
    >
      <div
        className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border p-3"
        style={{ backgroundColor: bg }}
      >
        {/* key remounts on replay; body wrapper is inert (no animation class) */}
        <div key={replayKey} aria-label={`${petLabel} ${emotionKind} emotion animation`}>
          <PetSprite
            kind={petKind}
            size="md"
            label={petLabel}
            hideFace
            emotion={emotionKind}
            emotionAnimClass={emClass}
            emotionPlayState={playState}
          />
        </div>
      </div>
      <span className="text-xs font-black text-center leading-tight max-w-[80px]">{petLabel}</span>
    </div>
  );
}

// A single emotion preview cell shown in the emotion grid.
// Animation class always mounted; only play-state toggles so pause/resume works correctly.
function EmotionAnimCell({
  emotion,
  paused,
  replayKey,
  selected,
  onSelect,
}: {
  emotion: EmotionDef;
  paused: boolean;
  replayKey: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const emClass = emotionAnimClass(emotion.kind);
  const playState = paused ? 'paused' : 'running';
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-testid={`emotion-cell-${emotion.kind}`}
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-left transition-all ${
        selected
          ? 'border-[#074F9A] shadow-[0_2px_0_#073B5C]'
          : 'border-border hover:border-[#074F9A]/40'
      } ${emotion.cardBg}`}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_2px_0_rgba(7,79,154,0.15)]">
        {/* key remounts on replay; animation class always present */}
        <div
          key={replayKey}
          className={emClass}
          style={{ animationPlayState: playState }}
        >
          <EmotionFaceSVG kind={emotion.kind} size={52} />
        </div>
      </div>
      <span className="text-xs font-black leading-tight text-center">{emotion.label}</span>
      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: emotion.tagBg, color: emotion.tagText }}>
        {emotion.kind}
      </span>
    </button>
  );
}

// Controls row — replay + pause + reduced-motion note
function AnimControls({
  paused,
  onTogglePause,
  onReplay,
  label,
}: {
  paused: boolean;
  onTogglePause: () => void;
  onReplay: () => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={`controls-${label}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={onReplay}
        data-testid={`btn-replay-${label}`}
        aria-label={`Replay ${label} animation`}
      >
        Replay
      </Button>
      <Button
        variant={paused ? 'default' : 'outline'}
        size="sm"
        onClick={onTogglePause}
        data-testid={`btn-pause-${label}`}
        aria-label={paused ? `Resume ${label} animation` : `Pause ${label} animation`}
      >
        {paused ? 'Resume' : 'Pause'}
      </Button>
    </div>
  );
}

// One cell in the combined body+emotion preview row.
// Extracted so useEatingFaceVisible can be called as a hook at component level.
function CombinedBodyCell({
  bs,
  selectedEmotion,
  bodyPaused,
  emotionPaused,
  reducedMotion,
  bodyReplayKey,
  emotionReplayKey,
}: {
  bs: { state: BodyState; label: string };
  selectedEmotion: EmotionKind;
  bodyPaused: boolean;
  emotionPaused: boolean;
  reducedMotion: boolean;
  bodyReplayKey: number;
  emotionReplayKey: number;
}) {
  const bAnimClass = bodyAnimClass(bs.state);
  const eAnimClass = emotionAnimClass(selectedEmotion);
  const bodyPlayState: 'paused' | 'running' = (bodyPaused || reducedMotion) ? 'paused' : 'running';
  const emotionPlayState: 'paused' | 'running' = (emotionPaused || reducedMotion) ? 'paused' : 'running';

  // EatingFace lifecycle: visible for 4.2 s then unmounts, leaving normal face.
  // Pause suspends countdown; reducedMotion keeps it visible indefinitely.
  const showEatingFace = useEatingFaceVisible({
    active: bs.state === 'eating',
    paused: bodyPaused || reducedMotion,
    reducedMotion,
    replayKey: bodyReplayKey,
  });

  return (
    <div className="flex flex-col items-center gap-2" data-testid={`combined-${bs.state}`}>
      <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border p-3 bg-[#FFF4BE]">
        {/* Outer div carries body animation; key changes on either replay */}
        <div
          key={`combined-${bs.state}-${bodyReplayKey}-${emotionReplayKey}`}
          className={bAnimClass}
          style={{ animationPlayState: bodyPlayState, transformOrigin: 'center bottom' }}
        >
          {/* Eating: chewing face for 4.2 s, then normal face resumes.
              Idle/playing: selected emotion on the face <g>. */}
          <PetSprite
            kind="nubbin"
            size="md"
            label={`Nubbin ${bs.state}`}
            hideFace
            eatingFace={showEatingFace}
            eatingPlayState={bodyPlayState}
            emotion={showEatingFace ? undefined : selectedEmotion}
            emotionAnimClass={showEatingFace ? undefined : eAnimClass}
            emotionPlayState={showEatingFace ? undefined : emotionPlayState}
          />
        </div>
      </div>
      <span className="text-xs font-black">{bs.label}</span>
      <span className="text-[10px] text-muted-foreground capitalize">
        {showEatingFace ? 'chewing' : selectedEmotion}
      </span>
    </div>
  );
}

export function MotionPage() {
  // Body animation section state
  const [bodyState, setBodyState] = useState<BodyState>('idle');
  const [bodyPaused, setBodyPaused] = useState(false);
  const [bodyReplayKey, setBodyReplayKey] = useState(0);

  // Emotion animation section state
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKind>('content');
  const [emotionPaused, setEmotionPaused] = useState(false);
  const [emotionReplayKey, setEmotionReplayKey] = useState(0);

  // Detect prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Replay remounts animated wrappers (new key) so finite animations restart.
  // Guarded by reducedMotion so clicking Replay has no effect when motion is off.
  const handleBodyReplay = useCallback(() => {
    if (reducedMotion) return;
    setBodyReplayKey((k) => k + 1);
    setBodyPaused(false);
  }, [reducedMotion]);

  const handleEmotionReplay = useCallback(() => {
    if (reducedMotion) return;
    setEmotionReplayKey((k) => k + 1);
    setEmotionPaused(false);
  }, [reducedMotion]);

  // Selected emotion def
  const emotionDef = EMOTIONS.find((e) => e.kind === selectedEmotion)!;

  const BODY_STATES: { state: BodyState; label: string; description: string; loop: string; duration: string }[] = [
    {
      state: 'idle',
      label: 'Idle',
      description: 'A slow, continuous float-bob that keeps the pet alive while nothing else is happening. Loops indefinitely at low amplitude to suggest steady breathing.',
      loop: 'Infinite loop',
      duration: '3.2 s',
    },
    {
      state: 'eating',
      label: 'Eating',
      description: 'Three forward lean-and-nod cycles (4.2 s total), one per bite. Each bite shows a dedicated chewing face: squinting eyes, an asymmetric chomping mouth with a food chunk peeking from the corner, and four crumbs that scatter and fade with staggered timing before resetting for the next bite. After the third cycle the idle float-bob resumes automatically.',
      loop: '3 cycles → idle',
      duration: '1.4 s per cycle',
    },
    {
      state: 'playing',
      label: 'Playing',
      description: 'Three bouncy side-to-side hops (5.4 s total). After the third hop the idle float-bob loop begins automatically, returning the pet to its resting motion without an abrupt cut.',
      loop: '3 hops → idle',
      duration: '1.8 s per hop',
    },
  ];

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <section
        className="relative overflow-hidden rounded-[2rem] border-4 border-[#074F9A] bg-gradient-to-br from-[#073B5C] via-[#0A58CA] to-[#FF5D8F] p-6 text-white"
        data-testid="motion-header"
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #FFE347 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFE347]">Motion / Sprite Animations</p>
          <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Living sprite system</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85">
            Three body states and twelve emotion animations form the Kinotchi motion vocabulary. Body animations preserve silhouette identity and support face interchange. Emotion animations add state-appropriate motion that strengthens each face geometry without relying on color.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#FFE347] px-3 py-1 text-xs font-black text-[#073B5C]">3 body states</span>
            <span className="rounded-full bg-[#FF86B8] px-3 py-1 text-xs font-black text-[#073B5C]">12 emotion animations</span>
            <span className="rounded-full bg-[#83DFF0] px-3 py-1 text-xs font-black text-[#073B5C]">Silhouette-safe</span>
            {reducedMotion && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white" data-testid="reduced-motion-badge">
                Reduced motion active — static fallback shown
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Reduced motion guidance ── */}
      {reducedMotion && (
        <div
          className="rounded-2xl border-2 border-[#074F9A] bg-[#EAF5FD] p-4 text-sm leading-6 text-[#073B5C]"
          role="status"
          data-testid="reduced-motion-notice"
        >
          <span className="font-black">Reduced motion is enabled on your device.</span> All sprite animations are paused and replaced with their static pose. To see live animations, disable &ldquo;Reduce motion&rdquo; in your system accessibility settings.
        </div>
      )}

      {/* ── Section 1: Body state animations ── */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground" data-testid="section-body-states">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="font-black text-xl">Body state animations</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Each body state drives the whole pet sprite. The face treatment layers on top unchanged, so any emotion can be combined with any body state.
            </p>
          </div>
          <AnimControls
            paused={bodyPaused}
            onTogglePause={() => setBodyPaused((p) => !p)}
            onReplay={handleBodyReplay}
            label="body"
          />
        </div>

        {/* State selector tabs */}
        <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Body animation state" data-testid="body-state-tabs">
          {BODY_STATES.map((bs) => (
            <button
              key={bs.state}
              type="button"
              role="tab"
              aria-selected={bodyState === bs.state}
              data-testid={`tab-body-${bs.state}`}
              onClick={() => { setBodyState(bs.state); handleBodyReplay(); }}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-black transition-all ${
                bodyState === bs.state
                  ? 'border-[#074F9A] bg-[#074F9A] text-white shadow-[0_2px_0_#073B5C]'
                  : 'border-border bg-muted text-muted-foreground hover:border-[#074F9A]/50'
              }`}
            >
              {bs.label}
            </button>
          ))}
        </div>

        {/* Description strip */}
        {(() => {
          const bs = BODY_STATES.find((b) => b.state === bodyState)!;
          return (
            <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4 flex flex-wrap gap-4 items-start" data-testid="body-state-desc">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-black text-sm">{bs.label}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">{bs.loop}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{bs.duration}</span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{bs.description}</p>
              </div>
            </div>
          );
        })()}

        {/* Pet grid */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {ANIM_PETS.map((pet) => (
            <AnimatedPetSprite
              key={`${pet.kind}-${bodyState}`}
              kind={pet.kind}
              label={pet.label}
              bg={pet.bg}
              bodyState={bodyState}
              paused={bodyPaused || reducedMotion}
              reducedMotion={reducedMotion}
              replayKey={bodyReplayKey}
            />
          ))}
        </div>

        {/* Silhouette rule callout */}
        <p className="mt-5 text-xs leading-5 text-muted-foreground border-t border-border pt-4">
          <span className="font-black text-foreground">Silhouette rule:</span> All three body animations translate and rotate from the pet&apos;s center-bottom anchor, so the silhouette footprint stays constant. The face <code className="font-mono text-[10px]">&lt;g&gt;</code> group inside the SVG receives only emotion motion — body motion does not displace it relative to the body, because both live in the same SVG coordinate space.
        </p>
      </section>

      {/* ── Section 2: Emotion animations ── */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground" data-testid="section-emotion-anims">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="font-black text-xl">Emotion animations</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Each emotion drives its own looping motion that reinforces the face geometry without relying on color. Select an emotion to preview its animation on all four representative pets.
            </p>
          </div>
          <AnimControls
            paused={emotionPaused}
            onTogglePause={() => setEmotionPaused((p) => !p)}
            onReplay={handleEmotionReplay}
            label="emotion"
          />
        </div>

        {/* Emotion grid — all 11 cells */}
        <div
          className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 mb-6"
          data-testid="emotion-grid"
        >
          {EMOTIONS.map((em) => (
            <EmotionAnimCell
              key={em.kind}
              emotion={em}
              paused={emotionPaused || reducedMotion}
              replayKey={emotionReplayKey}
              selected={selectedEmotion === em.kind}
              onSelect={() => { setSelectedEmotion(em.kind); handleEmotionReplay(); }}
            />
          ))}
        </div>

        {/* Selected emotion description */}
        <div
          className="mb-6 rounded-xl border border-border p-4"
          style={{ backgroundColor: emotionDef.cardBg.replace('bg-[', '').replace(']', '') || '#EAF5FD' }}
          data-testid="emotion-selected-desc"
        >
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-black text-sm">{emotionDef.label}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: emotionDef.tagBg, color: emotionDef.tagText }}>{emotionDef.kind}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">loops indefinitely</span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{emotionDef.description}</p>
        </div>

        {/* Pet body + emotion composite */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4" data-testid="emotion-pet-grid">
          {ANIM_PETS.map((pet) => (
            <AnimatedEmotionPet
              key={`${pet.kind}-${selectedEmotion}`}
              petKind={pet.kind}
              petLabel={pet.label}
              bg={pet.bg}
              emotionKind={selectedEmotion}
              paused={emotionPaused || reducedMotion}
              replayKey={emotionReplayKey}
            />
          ))}
        </div>

        <p className="mt-5 text-xs leading-5 text-muted-foreground border-t border-border pt-4">
          <span className="font-black text-foreground">Interchangeability:</span> Emotion animations target the face <code className="font-mono text-[10px]">&lt;g&gt;</code> group inside the SVG only — the body silhouette stays still. This means body-state and emotion transforms compose independently via separate CSS stacking contexts, so an eating Blubkin can express hunger concurrently without either animation interfering with the other.
        </p>
      </section>

      {/* ── Section 3: Body + Emotion combined preview ── */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground" data-testid="section-combined">
        <h2 className="font-black text-xl mb-1">Body state and emotion combined</h2>
        <p className="mt-1 text-sm text-muted-foreground mb-5 max-w-xl">
          The same Nubbin in all three body states. During eating, the dedicated chewing face (chomping mouth, crumbs) replaces the emotion face entirely — only one face renders at a time. Idle and playing preserve the currently selected emotion on the face group.
        </p>
        <div className="flex flex-wrap gap-6 justify-start" data-testid="combined-pet-row">
          {BODY_STATES.map((bs) => (
            <CombinedBodyCell
              key={bs.state}
              bs={bs}
              selectedEmotion={selectedEmotion}
              bodyPaused={bodyPaused}
              emotionPaused={emotionPaused}
              reducedMotion={reducedMotion}
              bodyReplayKey={bodyReplayKey}
              emotionReplayKey={emotionReplayKey}
            />
          ))}
        </div>
      </section>

      {/* ── Section 4: Animation reference table ── */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground" data-testid="section-reference">
        <h2 className="font-black text-xl mb-1">Animation reference</h2>
        <p className="text-sm text-muted-foreground mb-4">CSS class names, timing, and loop behaviour for every sprite animation in the system.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="anim-reference-table">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-black text-xs uppercase tracking-wide text-primary">Class</th>
                <th className="pb-2 pr-4 font-black text-xs uppercase tracking-wide text-primary">State</th>
                <th className="pb-2 pr-4 font-black text-xs uppercase tracking-wide text-primary">Duration</th>
                <th className="pb-2 font-black text-xs uppercase tracking-wide text-primary">Loop</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { cls: 'kino-anim-idle',      state: 'Body / Idle',               dur: '3.2 s',   loop: 'Infinite' },
                { cls: 'kino-anim-eat',       state: 'Body / Eating',             dur: '1.4 s',   loop: '3 cycles → idle' },
                { cls: 'kino-eat-mouth',      state: 'Eating face / Chomp',       dur: '1.4 s',   loop: '3 cycles' },
                { cls: 'kino-eat-eye',        state: 'Eating face / Squint',      dur: '1.4 s',   loop: '3 cycles' },
                { cls: 'kino-eat-crumb-a',    state: 'Eating face / Crumb A',     dur: '1.4 s',   loop: '3 cycles' },
                { cls: 'kino-eat-crumb-b',    state: 'Eating face / Crumb B',     dur: '1.4 s',   loop: '3 cycles' },
                { cls: 'kino-eat-crumb-c',    state: 'Eating face / Crumb C',     dur: '1.4 s',   loop: '3 cycles' },
                { cls: 'kino-eat-crumb-d',    state: 'Eating face / Crumb D',     dur: '1.4 s',   loop: '3 cycles' },
                { cls: 'kino-anim-play',      state: 'Body / Playing',            dur: '1.8 s',   loop: '3 hops → idle' },
                { cls: 'kino-em-content',     state: 'Emotion / Content',         dur: '4.0 s',   loop: 'Infinite' },
                { cls: 'kino-em-happy',       state: 'Emotion / Happy',           dur: '1.2 s',   loop: 'Infinite' },
                { cls: 'kino-em-excited',     state: 'Emotion / Excited',         dur: '0.9 s',   loop: 'Infinite' },
                { cls: 'kino-em-sad',         state: 'Emotion / Sad',             dur: '3.0 s',   loop: 'Infinite' },
                { cls: 'kino-em-angry',       state: 'Emotion / Angry',           dur: '0.7 s',   loop: 'Infinite' },
                { cls: 'kino-em-sick',        state: 'Emotion / Sick',            dur: '2.5 s',   loop: 'Infinite' },
                { cls: 'kino-em-hungry',      state: 'Emotion / Hungry',          dur: '1.6 s',   loop: 'Infinite' },
                { cls: 'kino-em-loved',       state: 'Emotion / Loved',           dur: '2.8 s',   loop: 'Infinite' },
                { cls: 'kino-em-sleepy',      state: 'Emotion / Sleepy',          dur: '4.5 s',   loop: 'Infinite' },
                { cls: 'kino-em-scared',      state: 'Emotion / Scared',          dur: '0.8 s',   loop: 'Infinite' },
                { cls: 'kino-em-bored',       state: 'Emotion / Bored',           dur: '5.0 s',   loop: 'Infinite' },
                { cls: 'kino-em-numb',        state: 'Emotion / Numb',            dur: '6.0 s',   loop: 'Infinite' },
                { cls: 'kino-anim-float',     state: 'Accent / Float',            dur: '2.4 s',   loop: 'Infinite' },
                { cls: 'kino-anim-sparkle',   state: 'Accent / Sparkle',          dur: '1.0 s',   loop: 'Infinite' },
                { cls: 'kino-anim-drool',     state: 'Accent / Drool',            dur: '1.8 s',   loop: 'Infinite' },
              ].map((row) => (
                <tr key={row.cls} data-testid={`ref-row-${row.cls}`}>
                  <td className="py-2 pr-4 font-mono text-xs text-primary">{row.cls}</td>
                  <td className="py-2 pr-4 text-xs">{row.state}</td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">{row.dur}</td>
                  <td className="py-2 text-xs text-muted-foreground">{row.loop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 5: Motion principles ── */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground" data-testid="section-principles">
        <h2 className="font-black text-xl mb-4">Motion principles</h2>
        <Guidelines items={[
          { kind: 'do', text: 'Use transform (translate, rotate, scale) and opacity only — never animate layout properties like width, height, or padding.' },
          { kind: 'do', text: 'Anchor body animations at center-bottom so the silhouette stays visually grounded.' },
          { kind: 'do', text: 'Keep idle loops subtle (under 6 px travel, under 4 deg rotation) so the pet feels alive without distracting.' },
          { kind: 'do', text: 'Let eating and playing run their 3 finite cycles, then transition automatically into the idle loop via a CSS animation list with a delay — no JavaScript timer needed.' },
          { kind: 'do', text: 'Replace the default face with a dedicated eating face during the eating body state — squinting eyes, an open chomping mouth with food visible at one corner, and crumbs that fall with staggered timing. Only one face renders at a time.' },
          { kind: 'do', text: 'Animate emotion on the face <g> group inside the SVG, not on the body wrapper, so body motion and emotion motion compose independently via separate transform stacks.' },
          { kind: 'do', text: 'Provide a static fallback for every animation by listing every real kino- class in the prefers-reduced-motion block in theme-template.css.' },
          { kind: 'dont', text: 'Do not remove animation classes on pause — only toggle animation-play-state so resume continues from where it stopped rather than restarting.' },
          { kind: 'dont', text: 'Do not run eating or playing animations as infinite loops — they would overwhelm the idle state and remove temporal meaning from actions.' },
          { kind: 'dont', text: 'Do not use animation-delay chains to simulate physics — use cubic-bezier easing on a single keyframe block instead.' },
        ]} />
      </section>

    </div>
  );
}

// ---------------------------------------------------------------------------
// EMOTION SYSTEM
// ---------------------------------------------------------------------------

// Each emotion is a self-contained face treatment described purely in SVG
// geometry. Color is secondary — form carries the state first.

/** Public re-export so consumers can type emotion kind without importing internals */
export type EmotionKind =
  | 'content'
  | 'happy'
  | 'sad'
  | 'sick'
  | 'excited'
  | 'angry'
  | 'hungry'
  | 'loved'
  // adjacent states that improve the system
  | 'sleepy'
  | 'scared'
  | 'bored'
  | 'numb';

type EmotionDef = {
  kind: EmotionKind;
  label: string;
  description: string;
  // canonical accent used on card background (soft pastel)
  cardBg: string;
  tagBg: string;
  tagText: string;
};

const EMOTIONS: EmotionDef[] = [
  {
    kind: 'content',
    label: 'Content',
    description: 'Resting, satisfied default state. Soft round eyes, gentle closed curve mouth, no brow tension.',
    cardBg: 'bg-[#EAF5FD]',
    tagBg: '#C4E6F8',
    tagText: '#073B5C',
  },
  {
    kind: 'happy',
    label: 'Happy',
    description: 'Upward arc eyes (half-closed in delight), wide open smile, plump cheek blush marks.',
    cardBg: 'bg-[#FFF8D6]',
    tagBg: '#FFE347',
    tagText: '#5A3800',
  },
  {
    kind: 'excited',
    label: 'Excited',
    description: 'Wide open circular eyes with highlight sparkles, huge open mouth, blush fully saturated, motion lines at temples.',
    cardBg: 'bg-[#FFF0FA]',
    tagBg: '#FF86B8',
    tagText: '#5A0030',
  },
  {
    kind: 'sad',
    label: 'Sad',
    description: 'Inner-corner brows raised, eyes drooping at outer edge, downward arc mouth, single teardrop shape below left eye.',
    cardBg: 'bg-[#ECF1FF]',
    tagBg: '#B8C8F8',
    tagText: '#1A2870',
  },
  {
    kind: 'angry',
    label: 'Angry',
    description: 'V-shaped brows angled sharply inward, compressed eye shapes, tight frown with exposed teeth marks.',
    cardBg: 'bg-[#FFF0EE]',
    tagBg: '#FFBFB8',
    tagText: '#7A1200',
  },
  {
    kind: 'sick',
    label: 'Sick',
    description: 'Swirly dizzy eyes (spiral pupils), drooping eyelids at half-mast, wavy mouth suggesting nausea, small cross marks at cheeks instead of blush.',
    cardBg: 'bg-[#F0FAF0]',
    tagBg: '#B4EAB4',
    tagText: '#1A4A1A',
  },
  {
    kind: 'hungry',
    label: 'Hungry',
    description: 'Eyes narrowed hopefully upward, mouth open in a wide hungry oval or salivating drool, small stomach-growl arc near the belly.',
    cardBg: 'bg-[#FFF5E8]',
    tagBg: '#FFD09A',
    tagText: '#5A2800',
  },
  {
    kind: 'loved',
    label: 'Loved',
    description: 'Heart-shaped pupils, rosy cheeks at max opacity, mouth in a blissful closed smile, small floating heart accent above the head.',
    cardBg: 'bg-[#FFF0F5]',
    tagBg: '#FFAACE',
    tagText: '#5A0030',
  },
  {
    kind: 'sleepy',
    label: 'Sleepy',
    description: 'Eyes almost fully closed as heavy ellipses, mouth in a tiny yawn oval, a small ZZZ symbol drifts above the head.',
    cardBg: 'bg-[#F0EEFF]',
    tagBg: '#C8B8F8',
    tagText: '#2A1F6A',
  },
  {
    kind: 'scared',
    label: 'Scared',
    description: 'Eyes wide with visible white sclera and contracted pupils, brows raised to high arches, mouth in a trembling open oval with shake marks.',
    cardBg: 'bg-[#F8F0FF]',
    tagBg: '#D4A8F8',
    tagText: '#3A1060',
  },
  {
    kind: 'bored',
    label: 'Bored',
    description: 'Half-lidded droopy eyes, mouth a flat line, one eye slightly lower than the other, small ellipsis dots beside the face.',
    cardBg: 'bg-[#F4F4F4]',
    tagBg: '#D4D4D4',
    tagText: '#444444',
  },
  {
    kind: 'numb',
    label: 'Numb',
    description: 'Emotionally flat and disconnected state. Empty horizontal eyes, no cheek color or accent marks, and a perfectly level mouth communicate low affect rather than boredom.',
    cardBg: 'bg-[#EEF1F3]',
    tagBg: '#C9D1D6',
    tagText: '#33424A',
  },
];

// ---------------------------------------------------------------------------
// Emotion face SVGs — each 120×120 viewBox, face-only (no body)
// These are the interchangeable face treatments.
// ---------------------------------------------------------------------------

// Shared face color constant (matches body sprites)
const FC = {
  outline: '#074F9A',
  face: '#073B5C',
  blush: '#FF5D8F',
  blushLight: 'rgba(255,93,143,0.55)',
  white: '#ffffff',
};

function EmotionFaceSVG({ kind, size = 96 }: { kind: EmotionKind; size?: number }) {
  // All faces share a 120×120 coordinate space centered at (60,60)
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <EmotionFaceLayer kind={kind} />
    </svg>
  );
}

function EmotionFaceLayer({ kind }: { kind: EmotionKind }) {
  return (
    <>
      {kind === 'content' && <ContentFace />}
      {kind === 'happy' && <HappyFace />}
      {kind === 'excited' && <ExcitedFace />}
      {kind === 'sad' && <SadFace />}
      {kind === 'angry' && <AngryFace />}
      {kind === 'sick' && <SickFace />}
      {kind === 'hungry' && <HungryFace />}
      {kind === 'loved' && <LovedFace />}
      {kind === 'sleepy' && <SleepyFace />}
      {kind === 'scared' && <ScaredFace />}
      {kind === 'bored' && <BoredFace />}
      {kind === 'numb' && <NumbFace />}
    </>
  );
}

// -- Content --
// Round dot eyes, gentle smile curve, light blush, no brow tension
function ContentFace() {
  return (
    <>
      {/* blush */}
      <ellipse cx="38" cy="72" rx="8" ry="5" fill={FC.blush} opacity=".35" />
      <ellipse cx="82" cy="72" rx="8" ry="5" fill={FC.blush} opacity=".35" />
      {/* eyes: solid round dots */}
      <circle cx="46" cy="58" r="6" fill={FC.face} />
      <circle cx="74" cy="58" r="6" fill={FC.face} />
      {/* eye shine */}
      <circle cx="48.5" cy="55.5" r="2" fill={FC.white} />
      <circle cx="76.5" cy="55.5" r="2" fill={FC.white} />
      {/* mouth: gentle closed smile */}
      <path d="M50 76 Q60 84 70 76" fill="none" stroke={FC.face} strokeWidth="3.5" strokeLinecap="round" />
    </>
  );
}

// -- Happy --
// Upward-arc (crescent) eyes, wide open smile with tooth gap, large blush
function HappyFace() {
  return (
    <>
      {/* blush — larger and more saturated */}
      <ellipse cx="36" cy="70" rx="10" ry="6" fill={FC.blush} opacity=".6" />
      <ellipse cx="84" cy="70" rx="10" ry="6" fill={FC.blush} opacity=".6" />
      {/* eyes: upward-arc crescents */}
      <path d="M40 58 Q46 50 52 58" fill={FC.face} stroke={FC.face} strokeWidth="1" strokeLinejoin="round" />
      <path d="M68 58 Q74 50 80 58" fill={FC.face} stroke={FC.face} strokeWidth="1" strokeLinejoin="round" />
      {/* mouth: wide open smile */}
      <path d="M44 74 Q60 92 76 74" fill="none" stroke={FC.face} strokeWidth="4" strokeLinecap="round" />
      {/* tooth line */}
      <path d="M51 78 Q60 86 69 78" fill="white" stroke={FC.face} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

// -- Excited --
// Wide circular eyes with sparkle stars, huge open mouth, intense blush, motion lines
function ExcitedFace() {
  return (
    <>
      {/* motion lines at temples */}
      <line x1="22" y1="48" x2="32" y2="52" stroke={FC.outline} strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
      <line x1="20" y1="56" x2="31" y2="57" stroke={FC.outline} strokeWidth="2.5" strokeLinecap="round" opacity=".35" />
      <line x1="98" y1="48" x2="88" y2="52" stroke={FC.outline} strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
      <line x1="100" y1="56" x2="89" y2="57" stroke={FC.outline} strokeWidth="2.5" strokeLinecap="round" opacity=".35" />
      {/* blush — full saturation */}
      <ellipse cx="34" cy="70" rx="11" ry="7" fill={FC.blush} opacity=".75" />
      <ellipse cx="86" cy="70" rx="11" ry="7" fill={FC.blush} opacity=".75" />
      {/* eyes: big open circles */}
      <circle cx="46" cy="56" r="9" fill={FC.face} />
      <circle cx="74" cy="56" r="9" fill={FC.face} />
      {/* large highlights */}
      <circle cx="50" cy="52" r="3.5" fill={FC.white} />
      <circle cx="78" cy="52" r="3.5" fill={FC.white} />
      {/* sparkle at top-right of each eye */}
      <path d="M56 46 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5Z" fill="#FFE347" stroke={FC.outline} strokeWidth="1" />
      <path d="M84 46 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5Z" fill="#FFE347" stroke={FC.outline} strokeWidth="1" />
      {/* mouth: huge open oval */}
      <path d="M42 74 Q60 96 78 74" fill="none" stroke={FC.face} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M50 79 Q60 90 70 79" fill="white" stroke={FC.face} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

// -- Sad --
// Inner-corner brows raised, eye outer-edge droops, downward mouth, teardrop
function SadFace() {
  return (
    <>
      {/* brows: raised inner corners */}
      <path d="M38 44 Q46 40 52 46" fill="none" stroke={FC.face} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M68 46 Q74 40 82 44" fill="none" stroke={FC.face} strokeWidth="3.5" strokeLinecap="round" />
      {/* eyes: drooping outer edge — oval with flat top, slanted bottom */}
      <ellipse cx="46" cy="58" rx="7" ry="6" fill={FC.face} transform="rotate(-8 46 58)" />
      <ellipse cx="74" cy="58" rx="7" ry="6" fill={FC.face} transform="rotate(8 74 58)" />
      <ellipse cx="46" cy="58" rx="4" ry="3" fill={FC.white} transform="rotate(-8 46 58)" />
      <ellipse cx="74" cy="58" rx="4" ry="3" fill={FC.white} transform="rotate(8 74 58)" />
      {/* mouth: downward arc */}
      <path d="M50 80 Q60 72 70 80" fill="none" stroke={FC.face} strokeWidth="3.5" strokeLinecap="round" />
      {/* teardrop below left eye */}
      <path d="M43 68 Q40 74 43 78 Q46 74 43 68Z" fill="#83B8F8" stroke={FC.outline} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  );
}

// -- Angry --
// V-shaped brows angling inward sharply, compressed eye shapes, tight frown
function AngryFace() {
  return (
    <>
      {/* brows: sharp V inward */}
      <path d="M36 42 L50 50" stroke={FC.face} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M84 42 L70 50" stroke={FC.face} strokeWidth="4.5" strokeLinecap="round" />
      {/* eyes: compressed — flat-top ovals */}
      <ellipse cx="46" cy="59" rx="7" ry="5" fill={FC.face} />
      <ellipse cx="74" cy="59" rx="7" ry="5" fill={FC.face} />
      {/* small white glints */}
      <circle cx="49" cy="57" r="1.8" fill={FC.white} />
      <circle cx="77" cy="57" r="1.8" fill={FC.white} />
      {/* mouth: tight frown, slightly open — shows effort */}
      <path d="M48 78 Q60 70 72 78" fill="none" stroke={FC.face} strokeWidth="4" strokeLinecap="round" />
      {/* bottom teeth line */}
      <path d="M52 77 Q60 72 68 77" fill="white" stroke={FC.face} strokeWidth="2" />
      {/* forehead crease marks */}
      <line x1="58" y1="44" x2="60" y2="50" stroke={FC.face} strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
      <line x1="62" y1="44" x2="60" y2="50" stroke={FC.face} strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
    </>
  );
}

// -- Sick --
// Spiral/dizzy eyes, drooping half-mast lids, wavy mouth, X marks at cheeks
function SickFace() {
  return (
    <>
      {/* cross marks at cheeks instead of blush */}
      <path d="M34 70 l4 4 m0 -4 l-4 4" stroke="#73C95D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M82 70 l4 4 m0 -4 l-4 4" stroke="#73C95D" strokeWidth="2.5" strokeLinecap="round" />
      {/* eyes: spiral/dizzy — concentric arcs + dot */}
      {/* left dizzy eye */}
      <circle cx="46" cy="57" r="9" fill="#D4EFD4" stroke={FC.face} strokeWidth="2" />
      <path d="M46 51 C52 51 54 57 50 60 C46 63 42 60 44 57 C45 55 47 56 46 57" fill="none" stroke={FC.face} strokeWidth="2" strokeLinecap="round" />
      <circle cx="46" cy="57" r="2" fill={FC.face} />
      {/* drooping eyelid left */}
      <path d="M37 53 Q46 50 55 53" fill="#D4EFD4" stroke={FC.face} strokeWidth="2.5" strokeLinecap="round" />
      {/* right dizzy eye */}
      <circle cx="74" cy="57" r="9" fill="#D4EFD4" stroke={FC.face} strokeWidth="2" />
      <path d="M74 51 C80 51 82 57 78 60 C74 63 70 60 72 57 C73 55 75 56 74 57" fill="none" stroke={FC.face} strokeWidth="2" strokeLinecap="round" />
      <circle cx="74" cy="57" r="2" fill={FC.face} />
      {/* drooping eyelid right */}
      <path d="M65 53 Q74 50 83 53" fill="#D4EFD4" stroke={FC.face} strokeWidth="2.5" strokeLinecap="round" />
      {/* mouth: wavy nausea wave */}
      <path d="M46 76 C50 72 54 80 58 76 C62 72 66 80 70 76 C72 73 73 74 74 76" fill="none" stroke={FC.face} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

// -- Hungry --
// Eyes narrowed hopefully upward, wide drooling open mouth, hunger accent
function HungryFace() {
  return (
    <>
      {/* blush — softer, hopeful */}
      <ellipse cx="38" cy="70" rx="8" ry="5" fill={FC.blush} opacity=".4" />
      <ellipse cx="82" cy="70" rx="8" ry="5" fill={FC.blush} opacity=".4" />
      {/* brows: slightly raised hopefully */}
      <path d="M39 46 Q46 42 52 46" fill="none" stroke={FC.face} strokeWidth="3" strokeLinecap="round" />
      <path d="M68 46 Q74 42 81 46" fill="none" stroke={FC.face} strokeWidth="3" strokeLinecap="round" />
      {/* eyes: narrowed upward ovals */}
      <ellipse cx="46" cy="57" rx="7" ry="5.5" fill={FC.face} />
      <ellipse cx="74" cy="57" rx="7" ry="5.5" fill={FC.face} />
      <ellipse cx="47.5" cy="55" rx="2.5" ry="2" fill={FC.white} />
      <ellipse cx="75.5" cy="55" rx="2.5" ry="2" fill={FC.white} />
      {/* mouth: wide open hungry oval */}
      <ellipse cx="60" cy="80" rx="14" ry="10" fill="white" stroke={FC.face} strokeWidth="3.5" />
      {/* tongue */}
      <path d="M50 86 Q60 94 70 86" fill="#FF6A98" stroke={FC.face} strokeWidth="2" strokeLinecap="round" />
      {/* drool drop below mouth */}
      <path d="M58 90 Q56 96 58 100 Q60 96 58 90Z" fill="#83DFF0" stroke={FC.outline} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  );
}

// -- Loved --
// Heart-shaped pupils, max-opacity blush, blissful closed-eye smile, floating heart
function LovedFace() {
  return (
    <>
      {/* floating heart accent above head */}
      <path d="M60 20 C60 16 55 12 52 16 C49 20 52 24 60 30 C68 24 71 20 68 16 C65 12 60 16 60 20Z" fill="#FF5D8F" stroke={FC.outline} strokeWidth="2" />
      {/* blush — deep and full */}
      <ellipse cx="34" cy="70" rx="12" ry="7" fill={FC.blush} opacity=".75" />
      <ellipse cx="86" cy="70" rx="12" ry="7" fill={FC.blush} opacity=".75" />
      {/* eyes: heart-shaped pupils */}
      {/* left eye white */}
      <ellipse cx="46" cy="58" rx="9" ry="8" fill="white" stroke={FC.face} strokeWidth="2" />
      {/* left heart pupil */}
      <path d="M46 55 C46 53 43 51 41 53 C39 55 41 57 46 61 C51 57 53 55 51 53 C49 51 46 53 46 55Z" fill="#FF5D8F" />
      {/* right eye white */}
      <ellipse cx="74" cy="58" rx="9" ry="8" fill="white" stroke={FC.face} strokeWidth="2" />
      {/* right heart pupil */}
      <path d="M74 55 C74 53 71 51 69 53 C67 55 69 57 74 61 C79 57 81 55 79 53 C77 51 74 53 74 55Z" fill="#FF5D8F" />
      {/* mouth: blissful closed smile */}
      <path d="M48 78 Q60 90 72 78" fill="none" stroke={FC.face} strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

// -- Sleepy --
// Heavy ellipse eyes nearly closed, tiny yawn oval mouth, ZZZ above
function SleepyFace() {
  return (
    <>
      {/* ZZZ above */}
      <text x="72" y="36" fontFamily="monospace" fontWeight="900" fontSize="10" fill={FC.face} opacity=".6">Z</text>
      <text x="80" y="28" fontFamily="monospace" fontWeight="900" fontSize="8" fill={FC.face} opacity=".45">Z</text>
      <text x="87" y="22" fontFamily="monospace" fontWeight="900" fontSize="6" fill={FC.face} opacity=".3">Z</text>
      {/* blush — soft */}
      <ellipse cx="38" cy="70" rx="7" ry="4" fill={FC.blush} opacity=".25" />
      <ellipse cx="82" cy="70" rx="7" ry="4" fill={FC.blush} opacity=".25" />
      {/* eyes: heavy drooping ellipses — just slivers */}
      <ellipse cx="46" cy="60" rx="9" ry="4" fill={FC.face} />
      <ellipse cx="74" cy="60" rx="9" ry="4" fill={FC.face} />
      {/* drooping lid covers top half */}
      <rect x="37" y="52" width="18" height="10" rx="3" fill="#D8D3FF" opacity=".9" />
      <rect x="65" y="52" width="18" height="10" rx="3" fill="#D8D3FF" opacity=".9" />
      {/* tiny bottom lashes */}
      <path d="M39 63 Q46 68 53 63" fill="none" stroke={FC.face} strokeWidth="2" strokeLinecap="round" />
      <path d="M67 63 Q74 68 81 63" fill="none" stroke={FC.face} strokeWidth="2" strokeLinecap="round" />
      {/* mouth: tiny yawn oval */}
      <ellipse cx="60" cy="80" rx="7" ry="5" fill="white" stroke={FC.face} strokeWidth="2.5" />
    </>
  );
}

// -- Scared --
// Wide open eyes with contracted pupils, high-arch brows, trembling mouth, shake marks
function ScaredFace() {
  return (
    <>
      {/* shake marks at sides */}
      <line x1="24" y1="54" x2="30" y2="56" stroke={FC.face} strokeWidth="2" strokeLinecap="round" opacity=".4" />
      <line x1="25" y1="60" x2="31" y2="61" stroke={FC.face} strokeWidth="2" strokeLinecap="round" opacity=".3" />
      <line x1="96" y1="54" x2="90" y2="56" stroke={FC.face} strokeWidth="2" strokeLinecap="round" opacity=".4" />
      <line x1="95" y1="60" x2="89" y2="61" stroke={FC.face} strokeWidth="2" strokeLinecap="round" opacity=".3" />
      {/* brows: raised to high arches */}
      <path d="M37 42 Q46 36 55 42" fill="none" stroke={FC.face} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M65 42 Q74 36 83 42" fill="none" stroke={FC.face} strokeWidth="3.5" strokeLinecap="round" />
      {/* eyes: wide white sclera + contracted pupils */}
      <circle cx="46" cy="59" r="10" fill="white" stroke={FC.face} strokeWidth="2.5" />
      <circle cx="74" cy="59" r="10" fill="white" stroke={FC.face} strokeWidth="2.5" />
      <circle cx="48" cy="61" r="4.5" fill={FC.face} />
      <circle cx="76" cy="61" r="4.5" fill={FC.face} />
      {/* tiny highlight dots */}
      <circle cx="50" cy="59" r="1.5" fill={FC.white} />
      <circle cx="78" cy="59" r="1.5" fill={FC.white} />
      {/* mouth: trembling oval open */}
      <path d="M50 78 Q54 74 58 78 Q62 82 66 78 Q70 74 70 78" fill="none" stroke={FC.face} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

// -- Bored --
// Half-lidded droopy eyes, flat-line mouth, one eye slightly lower, ellipsis dots
function BoredFace() {
  return (
    <>
      {/* ellipsis dots beside face */}
      <circle cx="24" cy="65" r="2.5" fill={FC.face} opacity=".3" />
      <circle cx="30" cy="65" r="2.5" fill={FC.face} opacity=".3" />
      <circle cx="36" cy="65" r="2.5" fill={FC.face} opacity=".3" />
      {/* blush — very faint */}
      <ellipse cx="38" cy="70" rx="7" ry="4" fill={FC.blush} opacity=".15" />
      <ellipse cx="82" cy="70" rx="7" ry="4" fill={FC.blush} opacity=".15" />
      {/* left eye: half-lidded, slightly lower */}
      <ellipse cx="46" cy="61" rx="8" ry="6" fill={FC.face} />
      <rect x="38" y="52" width="16" height="10" rx="2" fill="#D4D4D4" opacity=".85" />
      {/* right eye: half-lidded, slightly higher */}
      <ellipse cx="74" cy="59" rx="8" ry="6" fill={FC.face} />
      <rect x="66" y="50" width="16" height="10" rx="2" fill="#D4D4D4" opacity=".85" />
      {/* small glints */}
      <circle cx="48" cy="63" r="1.8" fill={FC.white} />
      <circle cx="76" cy="61" r="1.8" fill={FC.white} />
      {/* mouth: flat line with very slight droop */}
      <path d="M50 78 Q60 78 70 80" fill="none" stroke={FC.face} strokeWidth="3.5" strokeLinecap="round" />
    </>
  );
}

// -- Numb --
// Empty horizontal eyes, no cheek marks, perfectly level mouth
function NumbFace() {
  return (
    <>
      {/* eyes: empty horizontal bars with no highlight or pupil */}
      <rect x="38" y="55" width="16" height="7" rx="3.5" fill="#D9E1E6" stroke={FC.face} strokeWidth="2.5" />
      <rect x="66" y="55" width="16" height="7" rx="3.5" fill="#D9E1E6" stroke={FC.face} strokeWidth="2.5" />
      {/* mouth: perfectly level, emotionally neutral line */}
      <line x1="50" y1="79" x2="70" y2="79" stroke={FC.face} strokeWidth="3.5" strokeLinecap="round" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Emotion applied to pet bodies — composite: body silhouette + face overlay
// ---------------------------------------------------------------------------

// A subset of pets chosen to show cross-branch interchangeability clearly
type EmotionDemoEntry = {
  petKind: PetKind;
  petLabel: string;
  branch: Branch | 'universal';
  bodyBg: string;
};

const DEMO_PETS: EmotionDemoEntry[] = [
  { petKind: 'nubbin',   petLabel: 'Nubbin',   branch: 'universal', bodyBg: '#FFF4BE' },
  { petKind: 'pufflet',  petLabel: 'Pufflet',  branch: 'zephyr',    bodyBg: '#E6E4FF' },
  { petKind: 'blubkin',  petLabel: 'Blubkin',  branch: 'tide',      bodyBg: '#C4F5FA' },
  { petKind: 'twiglet',  petLabel: 'Twiglet',  branch: 'grove',     bodyBg: '#D7F3B9' },
];

function PetWithEmotion({
  petKind,
  petLabel,
  emotionKind,
  size = 96,
}: {
  petKind: PetKind;
  petLabel: string;
  emotionKind: EmotionKind;
  size?: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${petLabel} with ${emotionKind} expression`}
    >
      <PetSprite kind={petKind} size="md" label={petLabel} hideFace emotion={emotionKind} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Emotion catalog card
// ---------------------------------------------------------------------------

function EmotionCard({ emotion }: { emotion: EmotionDef }) {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border-2 p-4 ${emotion.cardBg}`}>
      {/* Face preview on white disc */}
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_2px_0_rgba(7,79,154,0.18)]">
        <EmotionFaceSVG kind={emotion.kind} size={76} />
      </div>
      {/* Label + tag */}
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="font-black text-base">{emotion.label}</span>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: emotion.tagBg, color: emotion.tagText }}>
          {emotion.kind}
        </span>
      </div>
      {/* Description */}
      <p className="text-xs leading-5 text-muted-foreground">{emotion.description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anatomy guidance row
// ---------------------------------------------------------------------------

type FacePart = {
  part: string;
  rule: string;
};

const FACE_ANATOMY: FacePart[] = [
  {
    part: 'Eyes',
    rule: 'Round dot = default. Upward arc = joy. Half-lid = sleepy or bored. Wide circle = fear or excitement. Spiral = sick. Heart = loved. Empty horizontal bar = numb. Use highlight dots for expressive pupils; omit them intentionally for numbness.',
  },
  {
    part: 'Brows',
    rule: 'Omit in content, happy, and excited states (brows imply tension). Raise inner corners for sadness. Angle sharply inward (V-shape) for anger. High arch for fear. Slight lift for hunger.',
  },
  {
    part: 'Mouth',
    rule: 'Closed gentle curve = content. Wide open arc = happy or excited. Downward arc = sad or angry. Slightly uneven flat line = bored. Perfectly level line = numb. Wavy = sick. Open oval = hungry or scared. Tiny oval = sleepy yawn. Blissful closed smile = loved.',
  },
  {
    part: 'Cheeks',
    rule: 'Soft ellipses at low opacity (35%) for content. Larger at higher opacity (60-75%) for happy, excited, loved. Omit or replace with X marks for sick. Very faint for bored and sleepy.',
  },
  {
    part: 'State accents',
    rule: 'Optional secondary marks that reinforce the emotion through geometry, not color alone: teardrop (sad), sparkle stars (excited), floating heart (loved), ZZZ (sleepy), motion lines (excited or angry), shake marks (scared), ellipsis dots (bored), drool drop (hungry).',
  },
];

// ---------------------------------------------------------------------------
// EmotionAssetsPage — exported
// ---------------------------------------------------------------------------

export function EmotionAssetsPage() {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKind>('content');

  return (
    <div className="space-y-8">

      {/* ── Section 1: Introduction ── */}
      <section className="relative overflow-hidden rounded-[2rem] border-4 border-[#074F9A] bg-gradient-to-br from-[#FFF0FA] via-[#EAF5FD] to-[#FFF8D6] p-6 text-[#073B5C]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #074F9A 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#074F9A]">Content / Emotions</p>
          <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Interchangeable face treatments</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#073B5C]/80">
            Each emotion is defined as a face treatment — a set of eyes, optional brows, a mouth shape, cheek marks, and optional state accents — that can be applied to any Kinotchi pet body without changing its silhouette. States are distinguished primarily through geometry rather than color, so they remain legible in all rendering contexts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#074F9A] px-3 py-1 text-xs font-black text-white">12 emotions</span>
            <span className="rounded-full bg-[#FFE347] px-3 py-1 text-xs font-black text-[#5A3800]">Silhouette-safe</span>
            <span className="rounded-full bg-[#FF86B8] px-3 py-1 text-xs font-black text-[#5A0030]">Accessible by shape</span>
          </div>
        </div>
      </section>

      {/* ── Section 2: Full catalog ── */}
      <section>
        <h2 className="font-black text-xl mb-4">Emotion catalog</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {EMOTIONS.map((emotion) => (
            <EmotionCard key={emotion.kind} emotion={emotion} />
          ))}
        </div>
      </section>

      {/* ── Section 3: Applied to pet bodies ── */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h2 className="font-black text-xl">Applied to pet bodies</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select an emotion below to preview it composited onto four representative creatures spanning all three branches. The body silhouette and markings remain unchanged.
            </p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">Interchangeability demo</span>
        </div>

        {/* Emotion picker */}
        <div className="flex flex-wrap gap-2 mb-6">
          {EMOTIONS.map((em) => (
            <button
              key={em.kind}
              type="button"
              onClick={() => setSelectedEmotion(em.kind)}
              aria-pressed={selectedEmotion === em.kind}
              className={`rounded-full border-2 px-3 py-1 text-xs font-black transition-all ${
                selectedEmotion === em.kind
                  ? 'border-[#074F9A] bg-[#074F9A] text-white shadow-[0_2px_0_#073B5C]'
                  : 'border-border bg-muted text-muted-foreground hover:border-[#074F9A]/50'
              }`}
            >
              {em.label}
            </button>
          ))}
        </div>

        {/* Pet grid with composited emotion */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {DEMO_PETS.map((pet) => {
            const branchLabel = pet.branch === 'universal' ? 'Universal' : `${pet.branch.charAt(0).toUpperCase()}${pet.branch.slice(1)} branch`;
            return (
              <div key={pet.petKind} className="flex flex-col items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border p-3"
                  style={{ backgroundColor: pet.bodyBg }}
                >
                  <PetWithEmotion
                    petKind={pet.petKind}
                    petLabel={pet.petLabel}
                    emotionKind={selectedEmotion}
                    size={96}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black">{pet.petLabel}</p>
                  <p className="text-xs text-muted-foreground">{branchLabel}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected emotion caption */}
        {(() => {
          const em = EMOTIONS.find((e) => e.kind === selectedEmotion)!;
          return (
            <div className="mt-4 rounded-xl border-2 border-dashed border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-sm">{em.label}</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: em.tagBg, color: em.tagText }}>{em.kind}</span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{em.description}</p>
            </div>
          );
        })()}
      </section>

      {/* ── Section 4: Face anatomy guide ── */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <h2 className="font-black text-xl mb-1">Face anatomy guide</h2>
        <p className="text-sm text-muted-foreground mb-5">
          These rules govern which geometry to change for each face part. Apply them consistently so any new emotion reads correctly at widget scale.
        </p>
        <div className="space-y-4">
          {FACE_ANATOMY.map((item) => (
            <div key={item.part} className="grid gap-1 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-[140px_1fr]">
              <span className="text-sm font-black text-primary">{item.part}</span>
              <p className="text-sm leading-6 text-muted-foreground">{item.rule}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 5: Side-by-side face comparison ── */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <h2 className="font-black text-xl mb-1">All faces at a glance</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Comparing all twelve emotions side-by-side confirms that each state is distinguishable by shape alone.
        </p>
        <div className="flex flex-wrap gap-4">
          {EMOTIONS.map((em) => (
            <div key={em.kind} className="flex flex-col items-center gap-2">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-border bg-white"
                role="img"
                aria-label={`${em.label} face`}
              >
                <EmotionFaceSVG kind={em.kind} size={52} />
              </div>
              <span className="text-[10px] font-black text-center leading-tight max-w-[64px]">{em.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 6: Design guidelines ── */}
      <section className="rounded-2xl border-2 bg-card p-6 text-card-foreground">
        <h2 className="font-black text-xl mb-4">Composition rules</h2>
        <Guidelines items={[
          { kind: 'do', text: 'Use eye and mouth geometry as the primary signal — change the shape before considering color.' },
          { kind: 'do', text: 'Keep the face treatment contained to the face region. Do not extend state accents outside the pet silhouette further than the floating heart or ZZZ anchored close to the head.' },
          { kind: 'do', text: 'Keep state accents small and secondary — they support the face, not replace it.' },
          { kind: 'do', text: 'Apply the same face treatment across all branches. A sad Blubkin and a sad Mosswick share the same eye and mouth geometry.' },
          { kind: 'dont', text: 'Do not rely on color alone to distinguish states. Sad and bored would look identical to each other if the only difference were hue.' },
          { kind: 'dont', text: 'Do not add brows to content, happy, excited, hungry, or loved states. Brows introduce tension; these states should feel open.' },
          { kind: 'dont', text: 'Do not scale the face region larger than the face area of the body sprite to preserve the silhouette rule.' },
        ]} />
      </section>

    </div>
  );
}
