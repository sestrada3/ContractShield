// Single source of truth for all design tokens.
// Import as: import { C } from '../theme';
export const C = {
  // Backgrounds
  bg:     '#0d0f15',
  surf:   '#171b26',
  hi:     '#1e2333',

  // Brand
  gold:   '#c9a84c',
  goldD:  '#8b6914',

  // Semantic
  red:    '#e05252',
  amber:  '#e0993a',
  green:  '#4caf7d',
  blue:   '#4a9eff',

  // Text
  t:      'rgba(255,255,255,0.92)',
  tm:     'rgba(255,255,255,0.55)',
  td:     'rgba(255,255,255,0.28)',

  // Borders
  border: 'rgba(255,255,255,0.08)',
} as const;
