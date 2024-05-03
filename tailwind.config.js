/** @type {import('tailwindcss').Config} */
module.exports = {
   content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
   ],
   theme: {
      extend: {
         backgroundImage: {
            'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            'gradient-conic':
               'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
         },
         boxShadow: {
            custom:
               '0.4rem 0.4rem 1rem rgba(173, 216, 230, 0.1), -0.4rem -0.4rem 1rem rgba(173, 216, 230, 0.8)',
            'custom-inset':
               '0.4rem 0.4rem 1rem rgba(173, 216, 230, 0.1) inset, -0.4rem -0.4rem 1rem rgba(173, 216, 230, 0.8) inset',
         },
      },
   },
   plugins: [],
};
