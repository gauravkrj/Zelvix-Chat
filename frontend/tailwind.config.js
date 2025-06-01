//tailwind.config.ts

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}', // <== Add this line
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0C1014',
        midDark: '#101721', 
        primary: '#117a65', //dark pink
        accent: '#45b39d', //ligh pink
        text: '#E0E0E0',
        light: '#F3F4F6',
        hovercolor: '#45b39d',
      },
    },
  },
  plugins: [],
};
