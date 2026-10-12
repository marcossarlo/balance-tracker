/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        card: 'var(--card)',
        foreground: 'var(--foreground)',
        work: 'var(--work)',
        learning: 'var(--learning)',
        alert: 'var(--alert)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--foreground)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-06)',
        md: 'var(--radius)',
        lg: 'var(--radius-12)',
        xl: 'var(--radius-16)',
        '2xl': 'var(--radius-20)',
        '3xl': 'var(--radius-26)',
      },
    },
  },
  plugins: [],
};
