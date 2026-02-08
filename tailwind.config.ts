/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Gris Sobria Principal
        primary: {
          DEFAULT: '#374151',  // Gris oscuro
          light: '#6b7280',    // Gris medio
          dark: '#1f2937',     // Gris muy oscuro
        },
        secondary: {
          DEFAULT: '#9ca3af',  // Gris claro
          light: '#d1d5db',    // Gris muy claro
          dark: '#6b7280',     // Gris medio oscuro
        },
        accent: {
          DEFAULT: '#3b82f6',  // Azul acento
          light: '#60a5fa',    // Azul claro
          dark: '#2563eb',     // Azul oscuro
        },
        success: {
          DEFAULT: '#10b981',  // Verde
          light: '#34d399',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',  // Naranja
          light: '#fbbf24',
          dark: '#d97706',
        },
        danger: {
          DEFAULT: '#ef4444',  // Rojo
          light: '#f87171',
          dark: '#dc2626',
        },
        // Override de colores de Tailwind para consistencia
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
}