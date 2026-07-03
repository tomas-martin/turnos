/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background:  "var(--background)",
        foreground:  "var(--foreground)",
        border:      "var(--border)",
        card:        "var(--card)",
        primary: {
          DEFAULT:    "var(--primary)",
          hover:      "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },
        muted: {
          DEFAULT:    "var(--muted-foreground)",
          background: "var(--muted-background)",
          foreground: "var(--muted-foreground)",
        },
        sidebar: {
          background: "var(--sidebar-background)",
          border:     "var(--sidebar-border)",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        'premium':    '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'premium-lg': '0 10px 40px -10px rgba(0,0,0,0.15), 0 2px 8px -2px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease forwards',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
};
