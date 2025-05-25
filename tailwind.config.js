/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Raleway', 'sans-serif'], 
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", 
        foreground: "hsl(var(--foreground))", 
        primary: {
          DEFAULT: "hsl(var(--primary))", 
          foreground: "hsl(var(--primary-foreground))", 
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))", 
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))", 
          foreground: "hsl(var(--card-foreground))", 
        },
        'header-bg': 'var(--header-bg)',
        'header-font': 'var(--header-font)',
        'footer-bg': 'var(--footer-bg)',
        'footer-font': 'var(--footer-font)',
        'category-icon-bg': 'var(--category-icon-bg)',
        'homepage-hero-bg': 'var(--homepage-hero-bg)',
        'homepage-hero-title-font': 'var(--homepage-hero-title-font)',
        'homepage-hero-subtitle-font': 'var(--homepage-hero-subtitle-font)',
        'homepage-hero-search-btn-bg': 'var(--homepage-hero-search-btn-bg)',
        'homepage-hero-search-btn-font': 'var(--homepage-hero-search-btn-font)',
        'homepage-hero-browse-all-btn-bg': 'var(--homepage-hero-browse-all-btn-bg)',
        'homepage-hero-browse-all-btn-font': 'var(--homepage-hero-browse-all-btn-font)',
        'homepage-filter-btn-bg': 'var(--homepage-filter-btn-bg)',
        'homepage-filter-btn-font': 'var(--homepage-filter-btn-font)',
        'homepage-listing-card-bg': 'var(--homepage-listing-card-bg)',
        'homepage-listing-card-category-btn-bg': 'var(--homepage-listing-card-category-btn-bg)',
        'homepage-listing-card-category-btn-font': 'var(--homepage-listing-card-category-btn-font)',
        'homepage-cta-bg': 'var(--homepage-cta-bg)',
        'homepage-cta-sub-bg': 'var(--homepage-cta-sub-bg)',
        'homepage-cta-title-font': 'var(--homepage-cta-title-font)',
        'homepage-cta-subtitle-font': 'var(--homepage-cta-subtitle-font)',
        'homepage-cta-btn-bg': 'var(--homepage-cta-btn-bg)',
        'homepage-cta-btn-font': 'var(--homepage-cta-btn-font)',
        'listing-actions-btn-bg': 'var(--listing-actions-btn-bg)',
        'listing-actions-btn-font': 'var(--listing-actions-btn-font)',
        'listing-other-listings-section-bg': 'var(--listing-other-listings-section-bg)',
        'listing-claim-section-bg': 'var(--listing-claim-section-bg)',
        'listing-claim-section-title-font': 'var(--listing-claim-section-title-font)',
        'listing-claim-section-content-font': 'var(--listing-claim-section-content-font)',
        'listing-claim-btn-bg': 'var(--listing-claim-btn-bg)',
        'listing-claim-btn-font': 'var(--listing-claim-btn-font)',
        'categories-page-category-btn-bg': 'var(--categories-page-category-btn-bg)',
        'categories-page-category-btn-font': 'var(--categories-page-category-btn-font)',
        'background-alt': '#f8f8f8',
        'header-bg': '#1A1F2C', 
        'accent-purple': '#9b87f5',
        'accent-green': '#7ABF3C', 
        'text-primary-dark': '#0a0a0a', 
        'text-secondary-gray': '#6b7280',
        'text-light': '#ffffff',
        geist: {
          DEFAULT: "hsl(var(--geist))",
          foreground: "hsl(var(--geist-foreground))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          foreground: "hsl(var(--gold-foreground))",
        },
        bronze: {
          DEFAULT: "hsl(var(--bronze))",
          foreground: "hsl(var(--bronze-foreground))",
        },
        brown: {
          DEFAULT: "hsl(var(--brown))",
          foreground: "hsl(var(--brown-foreground))",
        },
        stone: {
          DEFAULT: "hsl(var(--stone))",
          foreground: "hsl(var(--stone-foreground))",
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'fade-up': { 
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          "0%": {
            "box-shadow":
              "0 0 -10px hsl(var(--gold)), inset 0 0 -10px hsl(var(--gold))",
          },
          "40%": {
            "box-shadow":
              "0 0 20px hsl(var(--gold)), inset 0 0 10px hsl(var(--gold))",
            opacity: "1",
          },
          "60%": {
            "box-shadow":
              "0 0 20px hsl(var(--gold)), inset 0 0 10px hsl(var(--gold))",
            opacity: "1",
          },
          "100%": {
            "box-shadow":
              "0 0 -10px hsl(var(--gold)), inset 0 0 -10px hsl(var(--gold))",
          },
        },
        "glow-line": {
          "0%": {
            opacity: "0",
            width: "0",
          },
          "25%": {
            opacity: ".2",
            width: "100%",
          },
          "50%": {
            opacity: ".5",
            width: "100%",
          },
          "75%": {
            opacity: ".2",
            width: "100%",
          },
          "100%": {
            opacity: "0",
            width: "0",
          },
        },
        "hue-rotate": {
          "0%": {
            filter: "hue-rotate(0deg)",
          },
          "100%": {
            filter: "hue-rotate(360deg)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-up': 'fade-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        glow: "glow 4s linear infinite",
        "glow-line": "glow-line 10s linear infinite",
        "hue-rotate": "hue-rotate 3s linear infinite",
      },
      boxShadow: {
        glow: "0 0 2px hsl(var(--gold)), 0 0 2px hsl(var(--gold)), 0 0 2px hsl(var(--gold)), 0 0 10px hsl(var(--gold) / 0.6), 0 0 30px hsl(var(--gold) / 0.4), 0 0 60px hsl(var(--gold) / 0.2)",
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'elevation': '0 5px 30px rgba(0, 0, 0, 0.08)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.06)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), 
    require('@tailwindcss/typography'), 
    require('@tailwindcss/aspect-ratio'), 
    require('tailwindcss-animate') 
  ],
}
