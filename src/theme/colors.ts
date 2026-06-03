// App-wide colors and the default tier palette.

export const palette = {
  background: '#0f172a', // slate-900
  surface: '#1e293b', // slate-800
  surfaceAlt: '#334155', // slate-700
  border: '#475569', // slate-600
  text: '#f1f5f9', // slate-100
  textMuted: '#94a3b8', // slate-400
  primary: '#6366f1', // indigo-500
  danger: '#ef4444', // red-500
};

// Classic tier-list colors, S -> F (red -> green-ish), used as defaults.
export const tierColors = [
  '#ff7f7f', // S - red
  '#ffbf7f', // A - orange
  '#ffdf7f', // B - yellow
  '#ffff7f', // C - light yellow
  '#bfff7f', // D - lime
  '#7fff7f', // E - green
  '#7fbfff', // extra - blue
  '#bf7fff', // extra - purple
];

/** Default tier names + colors for a brand-new template. */
export const defaultTierSeed: { name: string; color: string }[] = [
  { name: 'S', color: tierColors[0] },
  { name: 'A', color: tierColors[1] },
  { name: 'B', color: tierColors[2] },
  { name: 'C', color: tierColors[3] },
  { name: 'D', color: tierColors[4] },
];

/** Pick a sensible default color for the Nth tier when the user adds one. */
export function colorForIndex(index: number): string {
  return tierColors[index % tierColors.length];
}

/**
 * Choose readable text color (black/white) for a given hex background.
 * Tier label backgrounds are light, so most will want dark text.
 */
export function contrastText(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111827' : '#ffffff';
}
