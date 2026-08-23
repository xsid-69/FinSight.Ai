/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        red: {
          top: "#FF4257",
          DEFAULT: "#E60E2B",
          deep: "#C60A24",
        },
        pink: {
          DEFAULT: "#E5124A",
          light: "#FF5B86",
          soft: "#FFECF1",
        },
        ink: "#1B1F2A",
        muted: {
          1: "#8A8F9C",
          2: "#AAAFBB",
          3: "#C9CDD6",
        },
        credit: "#0FB86A",
        line: {
          DEFAULT: "#F0F1F4",
          2: "#E7E9EE",
        },
        chip: "#F5F6F8",
      },
      borderRadius: {
        card: "20px",
        xl2: "28px",
      },
    },
  },
  plugins: [],
};
