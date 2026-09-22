/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#E9FBFF",
      "foreground": "#073B5C",
      "border": "#8EE2EF",
      "card": "#FFFFFF",
      "cardForeground": "#073B5C",
      "popover": "#FFFFFF",
      "popoverForeground": "#073B5C",
      "primary": "#0A58CA",
      "primaryForeground": "#FFFFFF",
      "secondary": "#FFD7E9",
      "secondaryForeground": "#8A1948",
      "muted": "#DFF7F8",
      "mutedForeground": "#27627B",
      "accent": "#FFE347",
      "accentForeground": "#5B3D00",
      "destructive": "#EF4D7A",
      "destructiveForeground": "#FFFFFF",
      "input": "#B1EBEF",
      "ring": "#FFCB2F",
      "chart1": "#FF5D8F",
      "chart2": "#45D6D6",
      "chart3": "#7057D9",
      "chart4": "#FFD449",
      "chart5": "#73C95D",
      "sidebar": "#073B5C",
      "sidebarForeground": "#F4FEFF",
      "sidebarBorder": "#14658E",
      "sidebarPrimary": "#FFD836",
      "sidebarPrimaryForeground": "#073B5C",
      "sidebarAccent": "#0D4B73",
      "sidebarAccentForeground": "#F4FEFF",
      "sidebarRing": "#FFD836"
    },
    "dark": {
      "background": "#07164B",
      "foreground": "#FFF7E8",
      "border": "#2B4E86",
      "card": "#102A66",
      "cardForeground": "#FFF7E8",
      "popover": "#102A66",
      "popoverForeground": "#FFF7E8",
      "primary": "#54D9FF",
      "primaryForeground": "#062B58",
      "secondary": "#5F2B6D",
      "secondaryForeground": "#FFD7E9",
      "muted": "#163875",
      "mutedForeground": "#B7D7F6",
      "accent": "#FFE347",
      "accentForeground": "#5B3D00",
      "destructive": "#FF6A9B",
      "destructiveForeground": "#3E0730",
      "input": "#234884",
      "ring": "#FFE347",
      "chart1": "#FF76A7",
      "chart2": "#5FE6E2",
      "chart3": "#A797FF",
      "chart4": "#FFE36A",
      "chart5": "#8AE578",
      "sidebar": "#041238",
      "sidebarForeground": "#FFF7E8",
      "sidebarBorder": "#1F3A72",
      "sidebarPrimary": "#FFE347",
      "sidebarPrimaryForeground": "#07164B",
      "sidebarAccent": "#102A66",
      "sidebarAccentForeground": "#FFF7E8",
      "sidebarRing": "#FFE347"
    }
  },
  "fontFamily": {
    "sans": [
      "Kosugi Maru",
      "Arial Rounded MT Bold",
      "sans-serif"
    ],
    "serif": [
      "Georgia",
      "serif"
    ],
    "mono": [
      "ui-monospace",
      "SFMono-Regular",
      "monospace"
    ]
  },
  "radius": "1.25rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
