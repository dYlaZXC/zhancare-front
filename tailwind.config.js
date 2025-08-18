/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'sans-serif'
        ]
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      screens: {
        // Custom breakpoints for specific display sizes
        'laptop-hd': {'raw': '(min-width: 1366px) and (max-width: 1440px) and (min-height: 700px) and (max-height: 800px)'},
        'desktop-fhd': {'raw': '(min-width: 1920px) and (min-height: 1000px) and (max-width: 2559px)'},
        'desktop-qhd': {'raw': '(min-width: 2560px) and (min-height: 1400px) and (max-width: 3839px)'},
        'desktop-4k': {'raw': '(min-width: 3840px) and (min-height: 2000px)'},
        
        // Additional helpful breakpoints
        '1366': '1366px',
        '1920': '1920px',
        '2560': '2560px',
        '3840': '3840px',
      },
      spacing: {
        // Custom spacing for specific display sizes
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
        '34': '8.5rem',   // 136px
        '38': '9.5rem',   // 152px
        '42': '10.5rem',  // 168px
      },
      height: {
        // Custom heights for video optimization
        '768': '768px',
        '1080': '1080px',
        '1440': '1440px',
        '2160': '2160px',
      },
      maxWidth: {
        // Content width optimization
        '8xl': '88rem',   // 1408px
        '9xl': '96rem',   // 1536px
        '10xl': '120rem', // 1920px
        '11xl': '160rem', // 2560px
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}