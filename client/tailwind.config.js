/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page: '#FAF8FF',
        ink: '#131A2E',
        muted: '#5B6478',
        line: '#E4E6F5',
        brand: {
          50: '#F3F4FF', 100: '#E8EAFF', 200: '#D3D8FB', 300: '#AEB8F2',
          500: '#2F4FD0', 600: '#1F3FB0', 700: '#0B2C9F', 800: '#08217A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(19,26,46,.04), 0 4px 16px rgba(31,63,176,.05)',
      },
    },
  },
  plugins: [],
};
