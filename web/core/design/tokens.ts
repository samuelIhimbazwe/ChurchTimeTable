/**
 * CMMS design tokens — single source for spacing, type, and motion.
 * Colors stay in globals.css (approved palette); do not redefine brand hues here.
 */
export const cmmsSpace = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

export const cmmsRadius = {
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  pill: "var(--radius-pill)",
} as const;

export const cmmsTypography = {
  display: "cmms-text-display",
  title: "cmms-text-title",
  heading: "cmms-text-heading",
  body: "cmms-text-body",
  caption: "cmms-text-caption",
  label: "cmms-text-label",
} as const;

export const cmmsMotion = {
  fast: "var(--motion-fast)",
  base: "var(--motion-base)",
  ease: "var(--motion-ease)",
} as const;

export const cmmsLayout = {
  pageStack: "cmms-page-stack",
  sectionStack: "cmms-section-stack",
  contentNarrow: "cmms-content-narrow",
  contentWide: "cmms-content-wide",
} as const;
