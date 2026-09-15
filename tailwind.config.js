/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#22408c',
          navydark: '#172b61',
          navylight: '#375ab8',
          saffron: '#EA580C',
          saffronlight: '#FFEDD5',
          green: '#15803D',
          greenlight: '#DCFCE7',
          bluebg: '#F0F9FF',
          cardborder: '#CBD5E1',
          gold: '#B45309'
        }
      },
      // Open Sans is the site's primary font everywhere. It has no Devanagari
      // glyphs, so the browser automatically falls through to Noto Sans
      // Devanagari (per-character) for Hindi text — English/Latin renders in
      // Open Sans, Hindi keeps rendering correctly in Noto Sans Devanagari.
      fontFamily: {
        hindi: ['"Open Sans"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        sans: ['"Open Sans"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'rural-lg': '1.25rem',
        'rural-xl': '1.5rem',
        'rural-2xl': '1.875rem'
      },
      minHeight: {
        'touch': '52px'
      }
    },
  },
  plugins: [],
}
