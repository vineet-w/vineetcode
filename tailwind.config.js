/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
        
        colors: {
          lime: "#faffa4",
          darklime: "#c0c470",
          darkgray: '#212121',
          lightgray: '#424242',
        },
        fontFamily: {
          quicksand: ["Quicksand", "sans-serif"],
          montserrat: ['Montserrat', 'sans-serif'],
        },
        animation: {
          'slide-in': 'slideIn 1s ease-in-out forwards',
        },
        keyframes: {
          slideIn: {
            '0%': {
              transform: 'translateY(50px)',
              opacity: '0',
            },
            '100%': {
              transform: 'translateY(0)',
              opacity: '1',
            },
          },
      },
      boxShadow: {
        'custom-even': '0 0px 7px rgba(0, 0, 0.2, 0.5)',
      },
    },
  },
  plugins: [],
};
