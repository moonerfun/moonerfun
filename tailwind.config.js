import plugin from 'tailwindcss/plugin';
import { addIconSelectors } from '@iconify/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '390px',
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        xxs: ['0.5rem', { lineHeight: '0.625rem' }],
      },

      colors: {
        // Mooner.fun Moon Theme
        moon: {
          50: '#f5f5f7',
          100: '#e8e8ed',
          200: '#d1d1db',
          300: '#a8a8b8',
          400: '#7c7c8a',
          500: '#5c5c6a',
          600: '#3d3d4a',
          700: '#2a2a35',
          800: '#1a1a22',
          850: '#14141a',
          900: '#0f0f14',
          950: '#0a0b0f',
        },
        // Space accent - deep purple/indigo for flywheel energy
        cosmic: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c4c4ff',
          300: '#a0a0ff',
          400: '#8080ff',
          DEFAULT: '#6366f1',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Golden for rewards/value (flywheel returns)
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          DEFAULT: '#f59e0b',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Redesign
        neutral: {
          50: '#f5f5f7',
          100: '#e8e8ed',
          200: '#d1d1db',
          300: '#a8a8b8',
          400: '#7c7c8a',
          500: '#5c5c6a',
          600: '#3d3d4a',
          700: '#2a2a35',
          750: '#22222c',
          800: '#1a1a22',
          850: '#14141a',
          900: '#0f0f14',
          925: '#0c0c10',
          950: '#0a0b0f',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c6',
          200: '#fee685',
          300: '#ffd230',
          400: '#ffb900',
          DEFAULT: '#ffb900',
          500: '#fe9a00',
          600: '#e17100',
          700: '#bb4d00',
          800: '#973c00',
          900: '#7b3306',
          950: '#461901',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d0fae5',
          200: '#a4f4cf',
          300: '#5ee9b5',
          400: '#3ce3ab',
          DEFAULT: '#3ce3ab',
          500: '#02c78c',
          600: '#00a272',
          700: '#00815f',
          800: '#00664c',
          900: '#005440',
          950: '#002f25',
        },
        rose: {
          50: '#fff1f4',
          100: '#ffe4ea',
          200: '#fecddb',
          300: '#fca5bd',
          400: '#f23674',
          DEFAULT: '#f23674',
          500: '#eb2d6f',
          600: '#e01e68',
          700: '#bd1358',
          800: '#9e134f',
          900: '#871449',
          950: '#4b0624',
        },
        primary: {
          DEFAULT: '#fcea2b',
          50: '#fffef5',
          100: '#fffde6',
          200: '#fff9bf',
          300: '#fff599',
          400: '#fcea2b',
          500: '#fcea2b',
          600: '#e6d526',
          700: '#c4b520',
          800: '#9c901a',
          900: '#7a7114',
          950: '#4a440c',
        },
      },
    },
  },
  plugins: [
    // Iconify plugin for clean selectors, requires writing a list of icon sets to load
    // Icons usage in HTML:
    //  <span class="iconify [icon-set]--[icon]"></span>
    //  <span class="iconify ph--airplane-tilt-fill"></span>
    addIconSelectors({
      // List of icon sets
      prefixes: ['ph'],
    }),
  ],
};
