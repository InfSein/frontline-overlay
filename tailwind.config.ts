import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        tiny: 'clamp(12px, 0.7vw, 14px)',
        small: 'clamp(14px, 0.9vw, 16px)',
        medium: 'clamp(16px, 1.1vw, 18px)',
        big: 'clamp(20px, 1.5vw, 24px)',
        large: 'clamp(28px, 2.2vw, 36px)',
      }
    }
  },
  plugins: []
}
export default config
