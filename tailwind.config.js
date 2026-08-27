/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#FDF6F4',
          100: '#FBEAE6',
          150: '#F6DDD6',
          200: '#F3D2CB',
          300: '#E7B3A8',
          400: '#D98F82',
          500: '#C06B5C',
          600: '#A24E42',
          700: '#7C3A31',
          800: '#5B2A24',
          900: '#3D1D19',
        },
        cream: '#FFFDF9',
        ivory: '#FAF5EE',
        sand: '#F2E9DF',
        charcoal: '#2B2320',
        muted: '#8A7D74',
        line: '#EDE1DA',
        success: '#4C7A5C',
        warning: '#B8863B',
        danger: '#B3453A',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        body: ['"Manrope"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 10px rgba(91, 42, 36, 0.06)',
        card: '0 4px 20px rgba(91, 42, 36, 0.08)',
        lift: '0 12px 32px rgba(91, 42, 36, 0.14)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stitch: {
          '0%': { strokeDashoffset: '400' },
          '100%': { strokeDashoffset: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.6s ease-out both',
        stitch: 'stitch 1.4s ease-out forwards',
        shimmer: 'shimmer 1.6s infinite linear',
      },
    },
  },
  plugins: [],
};
