/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft UI 2.0 - Paleta de colores suave y elegante
        soft: {
          // Grises ultrasuaves
          50: '#fefefe',
          100: '#f9fafb',
          200: '#f4f6f8',
          300: '#e8ebf0',
          400: '#d1d9e6',
          500: '#a8b4c8',
          600: '#8a96aa',
          700: '#6b778c',
          800: '#4d5a6e',
          900: '#2f3c50',
        },
        // Acentos suaves para ACA Chile
        primary: {
          50: '#fff8f6',
          100: '#ffeee8',
          200: '#ffd5c7',
          300: '#ffb397',
          400: '#ff8a5b',
          500: '#f56934',
          600: '#e04c1a',
          700: '#b93c14',
          800: '#973317',
          900: '#7a2e17',
        },
        // Colores secundarios pasteles
        pastel: {
          blue: '#e8f4fd',
          purple: '#f0ecff',
          pink: '#fef0f9',
          green: '#ecfdf5',
          yellow: '#fffbeb',
          orange: '#fff7ed',
        },
        // Sistema de grises Soft UI
        neutral: {
          0: '#ffffff',
          50: '#fafbfc',
          100: '#f4f6f8',
          150: '#eef2f6',
          200: '#e5e9f0',
          250: '#dae0ea',
          300: '#cdd5e0',
          350: '#bcc4d1',
          400: '#a3adc2',
          450: '#8a96b2',
          500: '#6c7a96',
          550: '#5a6b89',
          600: '#4a5c7c',
          650: '#3d4e6f',
          700: '#324062',
          750: '#283355',
          800: '#1f2748',
          850: '#171d3b',
          900: '#10142e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      screens: {
        'xs': '475px',
      },
      boxShadow: {
        // Soft UI 2.0 - Sombras ultrasuaves y elegantes
        'soft-xs': '0 1px 3px rgba(165, 177, 194, 0.15)',
        'soft-sm': '0 2px 6px rgba(165, 177, 194, 0.15), 0 1px 3px rgba(165, 177, 194, 0.1)',
        'soft-md': '0 4px 12px rgba(165, 177, 194, 0.15), 0 2px 6px rgba(165, 177, 194, 0.1)',
        'soft-lg': '0 8px 25px rgba(165, 177, 194, 0.15), 0 4px 12px rgba(165, 177, 194, 0.1)',
        'soft-xl': '0 12px 35px rgba(165, 177, 194, 0.15), 0 8px 25px rgba(165, 177, 194, 0.1)',
        'soft-2xl': '0 20px 50px rgba(165, 177, 194, 0.15), 0 12px 35px rgba(165, 177, 194, 0.1)',
        
        // Sombras internas Soft UI 2.0
        'soft-inset-xs': 'inset 0 1px 2px rgba(165, 177, 194, 0.2)',
        'soft-inset-sm': 'inset 0 2px 4px rgba(165, 177, 194, 0.2), inset 0 1px 2px rgba(165, 177, 194, 0.15)',
        'soft-inset-md': 'inset 0 4px 8px rgba(165, 177, 194, 0.2), inset 0 2px 4px rgba(165, 177, 194, 0.15)',
        
        // Efectos glassmorphism
        'glass-light': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'glass-medium': '0 8px 32px rgba(31, 38, 135, 0.5)',
        
        // Sombras de colores suaves
        'soft-colored-blue': '0 8px 25px rgba(59, 130, 246, 0.15)',
        'soft-colored-red': '0 8px 25px rgba(239, 68, 68, 0.15)',
        'soft-colored-green': '0 8px 25px rgba(34, 197, 94, 0.15)',
        'soft-colored-purple': '0 8px 25px rgba(168, 85, 247, 0.15)',
        
        // Compatibilidad con diseño anterior (neumórfico)
        'neuro-inset': 'inset 6px 6px 12px #bec8d7, inset -6px -6px 12px #ffffff',
        'neuro-outset': '6px 6px 12px #bec8d7, -6px -6px 12px #ffffff',
        'neuro-pressed': 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff',
        'neuro-soft': '2px 2px 6px #bec8d7, -2px -2px 6px #ffffff',
        'neuro-card': '8px 8px 16px #bec8d7, -8px -8px 16px #ffffff',
      },
      // Gradientes Soft UI 2.0
      backgroundImage: {
        'soft-gradient-light': 'linear-gradient(135deg, #fafbfc 0%, #f4f6f8 100%)',
        'soft-gradient-medium': 'linear-gradient(135deg, #f4f6f8 0%, #eef2f6 100%)',
        'soft-gradient-primary': 'linear-gradient(135deg, #fff8f6 0%, #ffeee8 100%)',
        'soft-gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
        'soft-gradient-pastel-blue': 'linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%)',
        'soft-gradient-pastel-purple': 'linear-gradient(135deg, #f0ecff 0%, #faf5ff 100%)',
        'soft-gradient-warm': 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',
      },
      
      // Blur effects para glassmorphism
      backdropBlur: {
        'xs': '2px',
        'soft': '12px',
        'medium': '16px',
        'strong': '24px',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'soft-pulse': 'softPulse 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(245, 105, 52, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(245, 105, 52, 0.4)' },
        },
        softPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}