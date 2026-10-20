/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#F4F7F4',
          100: '#E6ECE6',
          200: '#CDD9CE',
          300: '#AEC1B0',
          400: '#869F89',
          500: '#5E7B62',
          600: '#4A624E',
          700: '#3A4D3D',
        },
        sand: {
          50: '#FAF9F6',
          100: '#F3F1EC',
          200: '#E8E5DC',
          300: '#D5D0C2',
        },
        charcoal: {
          700: '#4A524C',
          800: '#2F3631',
          900: '#1D221E',
        },
        terracotta: {
          50: '#FDF6F4',
          100: '#FBEBE7',
          500: '#C86D58',
          600: '#A95542',
        },
        amberPastel: {
          50: '#FEF9F0',
          100: '#FCF1DE',
          500: '#C98A3C',
          600: '#A76D28',
        }
      },
    },
  },
  plugins: [],
};
