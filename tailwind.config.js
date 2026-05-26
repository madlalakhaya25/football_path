/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Surfaces ──────────────────────────────
        pitch:         '#0D0D0D',    // Deepest background
        'surface-1':   '#141414',    // Cards, sheets
        'surface-2':   '#1A1A1A',    // Elevated cards
        'surface-3':   '#222222',    // Input backgrounds
        border:        '#2A2A2A',    // Subtle dividers
        'border-light':'#333333',    // Slightly visible borders

        // ── Brand: Growfit Red (primary action) ─────
        green: {
          DEFAULT:  '#AF2D35',
          muted:    '#8B2329',
          dark:     '#6B1B1F',
          bg:       '#AF2D3514',     // 8% opacity tint
          border:   '#AF2D3540',     // 25% opacity border
        },

        // ── Accent: Amber (streaks, warnings, live) ─
        amber: {
          DEFAULT:  '#FFB547',
          muted:    '#CC8A1A',
          bg:       '#FFB54714',
          border:   '#FFB54740',
        },

        // ── Accent: Blue (info, scout, links) ────────
        blue: {
          DEFAULT:  '#4E9BFF',
          muted:    '#2D6FCC',
          bg:       '#4E9BFF14',
          border:   '#4E9BFF40',
        },

        // ── Status ───────────────────────────────────
        red: {
          DEFAULT:  '#FF4444',
          bg:       '#FF444414',
          border:   '#FF444440',
        },

        // ── Text ────────────────────────────────────
        ink: {
          primary:   '#FFFFFF',
          secondary: '#9A9A9A',
          tertiary:  '#5A5A5A',
          inverse:   '#0D0D0D',
        },
      },

      fontFamily: {
        sans: ['System'],
      },

      fontSize: {
        // Sports-style bold headline scale
        'display': [40, { fontWeight: '900', letterSpacing: -1 }],
        'hero':    [32, { fontWeight: '800', letterSpacing: -0.5 }],
        'title':   [24, { fontWeight: '700' }],
        'heading': [20, { fontWeight: '700' }],
        'body':    [15, { fontWeight: '400' }],
        'caption': [12, { fontWeight: '500' }],
      },

      borderRadius: {
        'card':   '14px',
        'button': '12px',
        'chip':   '100px',
      },

      boxShadow: {
        'green-glow': '0 0 20px rgba(175, 45, 53, 0.25)',
        'card':       '0 2px 8px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
