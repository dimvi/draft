/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans KR"', 'sans-serif'],
      },
      colors: {
        // Messaging UI System - Sent Bubbles
        'imessage-blue': '#007AFF',
        'sms-green': '#34C759',

        // Messaging UI System - Received Bubbles
        'bubble-light': '#E9E9EB',
        'bubble-dark': '#262629',

        // System Backgrounds - Light Mode
        'bg-light-primary': '#FFFFFF',
        'bg-light-secondary': '#F2F2F7',

        // System Backgrounds - Dark Mode
        'bg-dark-primary': '#121212',
        'bg-dark-secondary': '#1C1C1E',
      },
      borderRadius: {
        'bubble': '1.25rem',
      },
    },
  },
  plugins: [],
}
