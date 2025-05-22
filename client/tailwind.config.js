/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary colors
                "persivia-teal": "#15CC93",
                "persivia-blue": "#134D67",
                "persivia-light-blue": "#1A6589",

                // Secondary colors
                "persivia-slate": "#434D59",
                "persivia-white": "#FFFFFF",
                "persivia-gray": "#6B7280",
                "persivia-light-gray": "#F3F4F6",

                // Accent colors
                "persivia-light-teal": "#8CE6C9",
                "persivia-dark-slate": "#2D343C",

                // Map to standard color scale for easy use with Tailwind utilities
                primary: {
                    DEFAULT: "#15CC93",
                    50: "#F0FDF9",
                    100: "#DCFCEF",
                    200: "#BBF7E0",
                    300: "#8CE6C9",
                    400: "#43D9A7",
                    500: "#15CC93",
                    600: "#0FA576",
                    700: "#0C855F",
                    800: "#0A684B",
                    900: "#07563D",
                    950: "#033C2A"
                },
                secondary: {
                    DEFAULT: "#134D67",
                    50: "#E9F3F8",
                    100: "#D3E7F2",
                    200: "#A9CFE3",
                    300: "#7BB0CF",
                    400: "#4A8BAE",
                    500: "#134D67",
                    600: "#103E53",
                    700: "#0C2F3F",
                    800: "#09202B",
                    900: "#061117",
                    950: "#030809"
                },
                slate: {
                    DEFAULT: "#434D59",
                    50: "#F0F1F3",
                    100: "#E1E3E7",
                    200: "#C3C8CF",
                    300: "#A5ACB7",
                    400: "#86909F",
                    500: "#434D59",
                    600: "#3A4249",
                    700: "#2D343C",
                    800: "#1F232A",
                    900: "#121518",
                    950: "#090A0C"
                }
            },
            fontFamily: {
                sans: [
                    "Montserrat",
                    "ui-sans-serif",
                    "system-ui",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "Roboto",
                    "Helvetica Neue",
                    "Arial",
                    "sans-serif"
                ],
                body: [
                    "Lato",
                    "Montserrat",
                    "ui-sans-serif",
                    "system-ui",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "Roboto",
                    "Helvetica Neue",
                    "Arial",
                    "sans-serif"
                ]
            },
            keyframes: {
                gradient: {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                    },
                },
            },
            animation: {
                'gradient': 'gradient 8s ease infinite',
            },
        },
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            {
                persivia: {
                    "primary": "#15CC93",
                    "primary-content": "#FFFFFF",
                    "secondary": "#134D67",
                    "secondary-content": "#FFFFFF",
                    "accent": "#8CE6C9",
                    "accent-content": "#134D67",
                    "neutral": "#434D59",
                    "neutral-content": "#FFFFFF",
                    "base-100": "#F5F7FA",
                    "base-200": "#FFFFFF",
                    "base-300": "#E5E7EB",
                    "info": "#2D343C",
                    "success": "#15CC93",
                    "warning": "#F59E42",
                    "error": "#E02424",
                },
            },
            "cupcake",
            "synthwave",
            "corporate",
            "light",
            "dark",
        ]
    }
} 