// ============================================================================
// 1. Directiva de Next.js para ejecutar este componente SOLO en el navegador
// ============================================================================
'use client'; 
/* 
  ¿Por qué? 
  - Este componente usa hooks (useState, useEffect) y fetch, que no existen en el servidor.
  - Next.js, por defecto, renderiza en el servidor (SSR). Con 'use client' forzamos 
    a que se renderice del lado del cliente, lo que permite interactividad y estado.
*/

// Hooks de React: estado y efectos secundarios
import { useState, useEffect } from 'react';
// useState: guarda datos que pueden cambiar (foros, loading, error).
// useEffect: ejecuta código después de que el componente se monta (ej: llamar a la API).

// Componente Link de Next.js para navegar entre páginas sin recargar (SPA)
import Link from 'next/link';

// Íconos de la librería lucide-react (SVGs como componentes React)
import { MessageSquare, FileText, Clock } from 'lucide-react';
// MessageSquare: burbuja de chat → representa subforos.
// FileText: documento → representa cantidad de hilos.
// Clock: reloj → representa última actividad.

// ============================================================================
// Tipos TypeScript: definen la forma exacta de los datos que manejará la UI.
// Esto permite que el editor nos ayude y evita errores en tiempo de desarrollo.
// ============================================================================

// Cada subforo (por ejemplo: "Base de Datos" dentro de "Ciencias de la Computación")
type SubforumItem = {
  id: string;                 // Identificador único del subforo (UUID o número)
  name: string;              // Título del subforo (ej: "Consultas SQL")
  description: string | null; // Texto opcional; si no hay, vale null
  threadCount: number;       // Cuántos hilos (temas) tiene este subforo
  totalMessages: number;     // Suma de todos los mensajes de todos los hilos
  lastMovement: string | null; // Fecha (ISO string) del último mensaje/post; null si no hay actividad
};

// Un foro puede contener varios subforos (ej: "Ciencias de la Computación" contiene varios subforos)
type ForumItem = {
  id: string;
  name: string;              // Nombre del foro (ej: "Ingeniería Informática")
  description: string | null;
  subforums: SubforumItem[]; // Array de subforos → relación de composición
};

// Agrupación por facultad. La API devolverá un array de estos grupos.
type ForumGroup = {
  faculty: string;   // Clave que identifica la facultad (ej: "fci", "General", "fce")
  forums: ForumItem[]; // Lista de foros que pertenecen a esa facultad
};

// ─── Configuración de facultades (estilos y nombres legibles) ────────────
// Objeto que asigna a cada clave de facultad su etiqueta, badge y color CSS
const FACULTY_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  fci: {
    label: 'Facultad de Cs. Informáticas',
    badge: 'FCI',
    color: 'bg-blue-100 text-blue-800',
  },
  fce: {
    label: 'Facultad de Cs. Económicas',
    badge: 'FCE',
    color: 'bg-emerald-100 text-emerald-800',
  },
  fcs: {
    label: 'Facultad de Cs. de la Salud',
    badge: 'FCS',
    color: 'bg-rose-100 text-rose-800',
  },
  ft: {
    label: 'Facultad de Teología',
    badge: 'FT',
    color: 'bg-violet-100 text-violet-800',
  },
  faced: {
    label: 'Facultad de Educación',
    badge: 'FACED',
    color: 'bg-amber-100 text-amber-800',
  },
  General: {
    label: 'General',
    badge: 'General',
    color: 'bg-slate-100 text-slate-600',
  },
};

// Función helper para obtener la configuración de una facultad.
// Si no existe, usa valores por defecto.
function getFacultyConfig(faculty: string) {
  return (
    FACULTY_CONFIG[faculty] ??
    FACULTY_CONFIG[faculty.toLowerCase()] ?? {
      label: faculty,
      badge: faculty.toUpperCase().slice(0, 6),
      color: 'bg-slate-100 text-slate-600',
    }
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────
// Convierte una fecha a formato relativo: "hace 5 min", "Ayer", "hace 3 días", etc.
function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 30) return `hace ${diffDays} días`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Sub‑componentes ─────────────────────────────────────────────────────
// Cada fila de subforo (se muestra dentro de un foro)
function SubforumRow({ subforum }: { subforum: SubforumItem }) {
  return (
    <Link
      href={`/subforos/${subforum.id}`} // Al hacer clic, navega a la página del subforo
      className="group flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
    >
      {/* Icono a la izquierda */}
      <div className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center group-hover:bg-accent transition-colors">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Nombre y descripción */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-snug group-hover:underline underline-offset-2 truncate">
          {subforum.name}
        </p>
        {subforum.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subforum.description}</p>
        )}
      </div>

      {/* Estadísticas: visibles solo en pantallas medianas o más grandes (sm:flex) */}
      <div className="hidden sm:flex items-center gap-5 shrink-0 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 w-[6rem] justify-end tabular-nums">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          {subforum.threadCount}
          <span className="sr-only sm:not-sr-only">hilos</span>
        </span>
        <span className="flex items-center gap-1.5 w-[6.5rem] justify-end tabular-nums">
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          {subforum.totalMessages}
          <span className="sr-only sm:not-sr-only">posts</span>
        </span>
        <span className="flex items-center gap-1.5 w-[7rem] justify-end">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {formatRelativeDate(subforum.lastMovement)}
        </span>
      </div>

      {/* Versión móvil: solo muestra cantidad de hilos */}
      <div className="sm:hidden shrink-0 text-xs text-muted-foreground">
        {subforum.threadCount} hilos
      </div>
    </Link>
  );
}

// Tarjeta que agrupa los subforos de un mismo foro (ej. "Ciencias de la Computación")
function ForumCard({ forum }: { forum: ForumItem }) {
  if (forum.subforums.length === 0) return null; // No mostrar si no tiene subforos

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Cabecera del foro (solo si tiene nombre) */}
      {forum.name && (
        <div className="px-4 py-2 bg-muted/40 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {forum.name}
          </p>
          {forum.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{forum.description}</p>
          )}
        </div>
      )}
      {/* Lista de subforos dentro de este foro */}
      {forum.subforums.map((subforum) => (
        <SubforumRow key={subforum.id} subforum={subforum} />
      ))}
    </div>
  );
}

// ─── Esqueletos de carga (skeleton) ─────────────────────────────────────
// Una fila genérica de carga
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-md bg-muted animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-muted rounded w-2/5 animate-pulse" />
        <div className="h-3 bg-muted rounded w-3/5 animate-pulse" />
      </div>
      <div className="hidden sm:flex gap-5">
        <div className="h-3 bg-muted rounded w-14 animate-pulse" />
        <div className="h-3 bg-muted rounded w-16 animate-pulse" />
        <div className="h-3 bg-muted rounded w-20 animate-pulse" />
      </div>
    </div>
  );
}

// Componente de carga completo (muestra varias secciones con animación)
function LoadingSkeleton() {
  return (
    <div className="space-y-8" aria-label="Cargando foros…">
      {[3, 2].map((rows, i) => (
        <section key={i} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-14 bg-muted rounded-full animate-pulse" />
            <div className="h-4 w-52 bg-muted rounded animate-pulse" />
          </div>
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="px-4 py-2 bg-muted/40 border-b border-border">
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
            {Array.from({ length: rows }).map((_, j) => (
              <SkeletonRow key={j} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Estado vacío (sin datos) ───────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
        <MessageSquare className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h2 className="text-base font-semibold mb-1">No hay foros disponibles</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Aún no se han creado foros en la plataforma. Volvé más tarde.
      </p>
    </div>
  );
}

// ─── Encabezados de columnas (solo versión desktop) ─────────────────────
function ColumnHeaders() {
  return (
    <div className="hidden sm:flex items-center justify-end pr-4 pb-1 text-xs text-muted-foreground gap-5">
      <span className="w-[6rem] text-right">Hilos</span>
      <span className="w-[6.5rem] text-right">Mensajes</span>
      <span className="w-[7rem] text-right">Última actividad</span>
    </div>
  );
}

// ─── Componente principal de la página ───────────────────────────────────
export default function ForosPage() {
  // Estado local
  const [groups, setGroups] = useState<ForumGroup[]>([]); // datos de foros agrupados
  const [loading, setLoading] = useState(true);          // indicador de carga
  const [error, setError] = useState<string | null>(null); // mensaje de error

  // Efecto: al montar el componente, hacemos fetch a la API
  useEffect(() => {
    async function fetchForums() {
      try {
        const res = await fetch('/api/forums'); // Llama al endpoint interno de Next.js
        if (!res.ok) throw new Error('No se pudieron cargar los foros. Intentá de nuevo.');
        const data: ForumGroup[] = await res.json();
        setGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setLoading(false);
      }
    }
    fetchForums();
  }, []); // El array vacío significa que solo se ejecuta una vez

  // Ordenar grupos: la facultad 'General' debe aparecer al final
  const sortedGroups = [...groups].sort((a, b) => {
    if (a.faculty === 'General') return 1;
    if (b.faculty === 'General') return -1;
    return 0;
  });

  // Verificar si hay al menos un subforo visible
  const hasContent = sortedGroups.some((g) =>
    g.forums.some((f) => f.subforums.length > 0)
  );

  // Renderizado
  return (
    <div className="min-h-screen bg-background">
      {/* Cabecera fija sticky */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Foro UAP</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Foro de discusión — Universidad Adventista del Plata
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Mostrar skeleton mientras carga */}
        {loading && <LoadingSkeleton />}

        {/* Mostrar error si ocurrió */}
        {!loading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Mostrar vacío si no hay datos */}
        {!loading && !error && !hasContent && <EmptyState />}

        {/* Mostrar contenido real cuando hay datos */}
        {!loading && !error && hasContent && (
          <div className="space-y-8">
            {sortedGroups.map((group) => {
              const config = getFacultyConfig(group.faculty);
              // Filtrar foros que realmente tengan subforos
              const forumsWithSubforums = group.forums.filter((f) => f.subforums.length > 0);
              if (forumsWithSubforums.length === 0) return null;

              return (
                <section key={group.faculty} aria-labelledby={`section-${group.faculty}`}>
                  {/* Badge y título de la facultad */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.color}`}>
                      {config.badge}
                    </span>
                    <h2 id={`section-${group.faculty}`} className="text-base font-semibold">
                      {config.label}
                    </h2>
                  </div>

                  {/* Encabezados de columnas (solo desktop) */}
                  <ColumnHeaders />

                  {/* Lista de foros dentro de esta facultad */}
                  <div className="space-y-2">
                    {forumsWithSubforums.map((forum) => (
                      <ForumCard key={forum.id} forum={forum} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}