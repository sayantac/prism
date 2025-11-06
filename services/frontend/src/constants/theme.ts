/**
 * Theme Configuration
 * DaisyUI theme customization
 */

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  CUPCAKE: 'cupcake',
  EMERALD: 'emerald',
  CORPORATE: 'corporate',
  SYNTHWAVE: 'synthwave',
  RETRO: 'retro',
  CYBERPUNK: 'cyberpunk',
  VALENTINE: 'valentine',
  HALLOWEEN: 'halloween',
  GARDEN: 'garden',
  FOREST: 'forest',
  AQUA: 'aqua',
  LOFI: 'lofi',
  PASTEL: 'pastel',
  FANTASY: 'fantasy',
  WIREFRAME: 'wireframe',
  BLACK: 'black',
  LUXURY: 'luxury',
  DRACULA: 'dracula',
} as const;

export type Theme = typeof THEMES[keyof typeof THEMES];

/**
 * Available themes for user selection
 */
export const AVAILABLE_THEMES: Array<{ value: Theme; label: string }> = [
  { value: THEMES.LIGHT, label: 'Light' },
  { value: THEMES.DARK, label: 'Dark' },
  { value: THEMES.CUPCAKE, label: 'Cupcake' },
  { value: THEMES.EMERALD, label: 'Emerald' },
  { value: THEMES.CORPORATE, label: 'Corporate' },
  { value: THEMES.SYNTHWAVE, label: 'Synthwave' },
];

/**
 * Default theme
 */
export const DEFAULT_THEME: Theme = THEMES.LIGHT;

/**
 * Color palette for charts and visualizations
 */
export const COLOR_PALETTE = {
  primary: [
    '#3b82f6', // blue-500
    '#2563eb', // blue-600
    '#1d4ed8', // blue-700
    '#1e40af', // blue-800
    '#1e3a8a', // blue-900
  ],
  secondary: [
    '#8b5cf6', // violet-500
    '#7c3aed', // violet-600
    '#6d28d9', // violet-700
    '#5b21b6', // violet-800
    '#4c1d95', // violet-900
  ],
  success: [
    '#10b981', // green-500
    '#059669', // green-600
    '#047857', // green-700
    '#065f46', // green-800
    '#064e3b', // green-900
  ],
  warning: [
    '#f59e0b', // amber-500
    '#d97706', // amber-600
    '#b45309', // amber-700
    '#92400e', // amber-800
    '#78350f', // amber-900
  ],
  error: [
    '#ef4444', // red-500
    '#dc2626', // red-600
    '#b91c1c', // red-700
    '#991b1b', // red-800
    '#7f1d1d', // red-900
  ],
  neutral: [
    '#6b7280', // gray-500
    '#4b5563', // gray-600
    '#374151', // gray-700
    '#1f2937', // gray-800
    '#111827', // gray-900
  ],
} as const;

/**
 * Gradient presets
 */
export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
  ocean: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
  sunset: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
  purple: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
} as const;

/**
 * Icon sizes
 */
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

/**
 * Spacing scale
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

/**
 * Border radius scale
 */
export const BORDER_RADIUS = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
} as const;

/**
 * Shadow presets
 */
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;
