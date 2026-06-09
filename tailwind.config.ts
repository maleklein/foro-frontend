import type { Config } from "tailwindcss";

const config: Config = {
  // Activa el modo oscuro (dark mode) usando una clase CSS.
  // Cuando el elemento <html> tiene la clase "dark", se aplican los estilos oscuros.
  darkMode: ["class"],

  // Le dice a Tailwind en qué archivos tiene que buscar las clases CSS que usás.
  // Tailwind solo genera el CSS de las clases que realmente aparecen en estos archivos,
  // lo que hace que el CSS final sea muy liviano.
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      // Colores personalizados del proyecto.
      // En vez de valores fijos (ej: "#ffffff"), usan variables CSS (var(--background)).
      // Esas variables están definidas en globals.css y cambian según el modo
      // claro u oscuro. Así el mismo color "background" es blanco en light y 
      // oscuro en dark, sin tener que cambiar nada en los componentes.
      colors: {
        // Color de fondo principal de la app
        background: "var(--background)",
        // Color de texto principal
        foreground: "var(--foreground)",

        // Colores para las cards (tarjetas de contenido)
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },

        // Colores para los popovers (pequeñas ventanas flotantes)
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },

        // Color primario: el color principal de la app (botones, links, etc.)
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },

        // Color secundario: acciones secundarias, menos importantes
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },

        // Muted: textos o elementos apagados, menos prominentes
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },

        // Accent: color de énfasis para highlights o hover states
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },

        // Destructive: color para acciones peligrosas (borrar, error)
        // En tu proyecto lo ves en los mensajes de error del formulario
        destructive: {
          DEFAULT: "var(--destructive)",
        },

        // Colores para bordes, inputs y el anillo de focus
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        // Colores para gráficos (no los usamos en este proyecto)
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },

        // Colores para un sidebar (no lo usamos en este proyecto)
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },

      // Bordes redondeados personalizados.
      // También usan una variable CSS (--radius) para mantener consistencia.
      // Si cambiás --radius en globals.css, todos los bordes se actualizan solos.
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;