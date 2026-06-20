import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Template de título: cada página puede definir su propio título y queda como
// "Mi título · Foro UAP". Si una página no define nada, se usa el default.
export const metadata: Metadata = {
  title: {
    default: "Foro UAP",
    template: "%s · Foro UAP",
  },
  description: "Foro de discusión de la Universidad Adventista del Plata",
  applicationName: "Foro UAP",
};

// Viewport: mobile-first. `width=device-width` evita que el navegador haga
// zoom raro en mobile. `initialScale: 1` arranca sin zoom. `themeColor`
// pinta la barra del navegador en mobile (verde UAP-ish).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={geistSans.variable}>
      <body className={`${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
