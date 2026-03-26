/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg:       'var(--bg)',
        surface:  'var(--surface)',
        surface2: 'var(--surface2)',
        surface3: 'var(--surface3)',
        accent:   'var(--accent)',
        accent2:  'var(--accent2)',
        accent3:  'var(--accent3)',
        accent4:  'var(--accent4)',
        accent5:  'var(--accent5)',
        text1:    'var(--text)',
        text2:    'var(--text2)',
        text3:    'var(--text3)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
        strong:  'var(--border2)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease both',
        'slide-up':  'slideUp 0.25s ease both',
        'pulse-dot': 'pulse 2s infinite',
      },
    },
  },
  plugins: [],
};
