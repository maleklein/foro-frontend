import type { Metadata } from "next";

// Como `foros/page.tsx` es Client Component, no puede exportar `metadata`
// directamente. Este layout (que es Server Component por default) define el
// título de pestaña para la página de foros: "Foros · Foro UAP".
export const metadata: Metadata = {
  title: "Foros",
};

export default function ForosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
