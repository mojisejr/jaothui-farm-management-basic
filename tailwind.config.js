import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        jaothui: '#D4AF37',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: [
      {
        jaothui: {
          primary: '#D4AF37',
          'primary-focus': '#b8932e',
          'primary-content': '#ffffff',
          secondary: '#f6d860',
          'secondary-focus': '#e0c04d',
          'secondary-content': '#1f2937',
          accent: '#37cdbe',
          'accent-focus': '#2fa89a',
          'accent-content': '#ffffff',
          neutral: '#3d4451',
          'neutral-focus': '#2b323b',
          'neutral-content': '#ffffff',
          'base-100': '#ffffff',
          'base-200': '#f9fafb',
          'base-300': '#e5e7eb',
          'base-content': '#1f2937',
          info: '#2094f3',
          success: '#009485',
          warning: '#ff9900',
          error: '#ff5724',
        },
      },
      'dark',
    ],
  },
};

export default config; 