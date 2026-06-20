
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { bffFetch } from '@/lib/bff';
import { getSessionCookie, type SessionData } from '@/lib/auth';
import { CreateForumDialog } from '@/components/forums/create-forum-dialog';
import { UserMenu } from '@/components/user-menu';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

// Los campos coinciden con los nombres del modelo Mongoose en el BFF
// _id: MongoDB genera este id automáticamente (con guión bajo)
// nombre, descripcion, facultad: coinciden con el schema de Foro.js en el BFF
type Foro = {
  _id: string;
  nombre: string;
  descripcion?: string | null; // opcional: un foro puede no tener descripción
  facultad: string;
};

const FACULTY_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  humanidades: { label: 'Facultad de Humanidades', badge: 'FH', color: 'bg-blue-100 text-blue-800' },
  economicas: { label: 'Facultad de Cs. Económicas', badge: 'FCE', color: 'bg-emerald-100 text-emerald-800' },
  teologia: { label: 'Facultad de Teología', badge: 'FT', color: 'bg-violet-100 text-violet-800' },
  salud: { label: 'Facultad de Cs. de la Salud', badge: 'FCS', color: 'bg-rose-100 text-rose-800' },
  instituto: { label: 'Instituto Superior', badge: 'IS', color: 'bg-amber-100 text-amber-800' },
  preuniversitario: { label: 'Preuniversitario', badge: 'PRE', color: 'bg-pink-100 text-pink-800' },
  general: { label: 'General', badge: 'GEN', color: 'bg-slate-100 text-slate-600' },
};

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

function ForoCard({ foro }: { foro: Foro }) {
  const config = getFacultyConfig(foro.facultad);
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center mt-0.5">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-snug">
              {foro.nombre}
            </p>
            {foro.descripcion && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{foro.descripcion}</p>
            )}
          </div>
        </div>
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${config.color}`}>
          {config.badge}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-border rounded-lg p-4 bg-card animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 rounded-md bg-muted shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        </div>
        <div className="h-5 w-14 bg-muted rounded-full shrink-0" />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-label="Cargando foros…">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

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

export default function ForosPage() {
  const [foros, setForos] = useState<Foro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);

  // useCallback memoriza la función para que no se recree en cada render
  // Es necesario porque fetchForos está en el array de dependencias de useEffect
  // Sin useCallback, useEffect se ejecutaría infinitamente
  const fetchForos = useCallback(async () => {
    try {
      setError(null);
      const res = await bffFetch('/foros');
      if (!res.ok) throw new Error('No se pudieron cargar los foros. Intentá de nuevo.');
      const data: Foro[] = await res.json();
      setForos(data);
    } catch {
      setError('No se pudieron cargar los foros. El servidor puede estar temporalmente inaccesible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForos();              // carga los foros del BFF al montar el componente
    setSession(getSessionCookie()); // lee la cookie para saber si hay sesión activa
  }, [fetchForos]); // se re-ejecuta solo si fetchForos cambia (que nunca cambia gracias a useCallback)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Foro UAP</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Foro de discusión — Universidad Adventista del Plata
            </p>
          </div>
          {session ? (
            <div className="flex items-center gap-3">
              <UserMenu session={session} />
              <CreateForumDialog onCreated={fetchForos} />
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {loading && <LoadingSkeleton />}

        {!loading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && foros.length === 0 && <EmptyState />}

        {!loading && !error && foros.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {foros.map((foro) => (
              <ForoCard key={foro._id} foro={foro} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
