/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sasta-gold': {
          DEFAULT: '#F2C94C',
          hover: '#E0B22E',
          dark: '#C69214',
          light: '#FDF3D6',
        },
        'sasta-yellow': {
          light: '#FFF8DC',
          soft: '#FFF3C4',
          cream: '#FFFDF5',
        },
        'sasta-navy': {
          DEFAULT: '#0F1E36',
          dark: '#0A1322',
          light: '#1E2D48',
        },
        'sasta-border': '#EDE3B8',
        'sasta-heading': '#1F1F1F',
        'sasta-body': '#555555',
        'sasta-muted': '#888888',
      },
      fontFamily: {
        serif: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px rgba(237, 227, 184, 0.25)',
        'drawer': '-4px 0 24px rgba(0, 0, 0, 0.12)',
      },
      aspectRatio: {
        'portrait': '2 / 3',
      }
    },
  },
  plugins: [],
}
