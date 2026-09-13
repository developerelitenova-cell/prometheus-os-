/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "inverse-primary": "#e8c086", "surface-container-lowest": "#ffffff", "on-primary": "#ffffff",
        "surface-container-high": "#e9e7ed", "on-tertiary-fixed-variant": "#5c4304", "surface-variant": "#e9e0d4",
        "on-tertiary-container": "#261900", "secondary-fixed": "#e1d3c0", "primary-container": "#876936",
        "on-primary-fixed-variant": "#5b4213", "on-secondary-fixed": "#291807", "on-surface-variant": "#4b463f",
        "error": "#ba1a1a", "on-tertiary": "#ffffff", "surface-dim": "#dfd9d1", "surface-bright": "#fef8ef",
        "on-background": "#1e1b16", "on-surface": "#1e1b16", "on-secondary-container": "#291807",
        "inverse-on-surface": "#f6efe7", "on-error": "#ffffff", "on-error-container": "#410002",
        "surface-container": "#f4eee6", "on-secondary": "#ffffff", "surface-container-highest": "#e4ddd6",
        "primary-fixed-dim": "#e8c086", "tertiary-container": "#ffdea2", "primary": "#725523",
        "secondary-container": "#e1d3c0", "tertiary": "#5c4304", "tertiary-fixed-dim": "#eec054",
        "on-primary-container": "#ffffff", "error-container": "#ffdad6", "on-secondary-fixed-variant": "#584431",
        "on-primary-fixed": "#261900", "secondary-fixed-dim": "#c5b7a5", "outline-variant": "#cdc5bc",
        "outline": "#7d766e", "tertiary-fixed": "#ffdea2", "on-tertiary-fixed": "#261900",
        "secondary": "#715a42", "surface-container-low": "#faf4ec", "inverse-surface": "#33302a",
        "primary-fixed": "#ffddaa",
        "surface": "#fef8ef",
        "background": "#fef8ef",
        "danger": "#ba1a1a",
        "gold": "#b08d57",
        "gold-deep": "#8a6d3d",
        "gold-light": "#e8d9b5"
      },
      fontSize: {
        "display-lg": ["57px", "64px"], "display-md": ["45px", "52px"], "display-sm": ["36px", "44px"], "display": ["57px", "64px"],
        "headline-lg": ["32px", "40px"], "headline-md": ["28px", "36px"], "headline-sm": ["24px", "32px"],
        "title-lg": ["22px", "28px"], "title-md": ["16px", "24px"], "title-sm": ["14px", "20px"],
        "body-lg": ["16px", "24px"], "body-md": ["14px", "20px"], "body-sm": ["12px", "16px"],
        "label-lg": ["14px", "20px"], "label-md": ["12px", "16px"], "label-sm": ["11px", "16px"],
        "caption": ["10px", "14px"]
      },
      fontFamily: {
        "body-md": "Inter", "body-sm": "Inter", "label-md": "Inter", "label-sm": "Inter",
        "headline-sm": "Inter", "title-sm": "Inter", "label-lg": "Inter", "headline-md": "Inter",
        "title-md": "Inter", "title-lg": "Inter", "body-lg": "Inter", "headline-lg": "Inter", "caption": "Inter"
      },
      spacing: {
        "space-xs": "4px",
        "space-sm": "8px",
        "space-md": "16px",
        "space-lg": "24px",
        "space-xl": "32px",
        "margin-mobile": "16px",
        "margin-tablet": "24px",
        "margin": "32px"
      }
    }
  },
  plugins: [],
}
