/** @type {import('tailwindcss').Config} */
// This tells Tailwind where to look for class names in your project.
// It scans these files and only includes the CSS for classes you actually use —
// which keeps the final CSS bundle small.
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
