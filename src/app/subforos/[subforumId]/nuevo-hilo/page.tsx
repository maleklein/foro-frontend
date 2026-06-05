'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Paperclip, ChevronRight, AlertCircle, CheckCircle2, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubforumInfo = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  forum: { id: string; name: string; faculty: string | null };
};

type FormState = { title: string; content: string; tags: string[] };
type FormErrors = { title?: string; content?: string; tags?: string; general?: string };
type CreatedThread = { id: string; title: string; slug: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const TITLE_MAX = 150;
const TITLE_WARN = Math.floor(TITLE_MAX * 0.9);

// ─── Validation ───────────────────────────────────────────────────────────────

function validateTitle(v: string): string | undefined {
  if (!v.trim()) return 'El título es requerido';
  if (v.trim().length < 5) return 'El título debe tener al menos 5 caracteres';
  if (v.length > TITLE_MAX) return `El título no puede exceder ${TITLE_MAX} caracteres`;
}

function validateContent(v: string): string | undefined {
  if (!v.trim()) return 'El contenido es requerido';
  if (v.trim().length < 10) return 'El contenido debe tener al menos 10 caracteres';
}

function validateTags(v: string[]): string | undefined {
  if (v.length === 0) return 'Seleccioná al menos un tag';
}

// ─── FieldError ───────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-sm text-destructive mt-1" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-48 bg-muted rounded" />
      <div className="space-y-1.5">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-10 bg-muted rounded-md" />
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-44 bg-muted rounded-md" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-muted rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({
  thread,
  subforumId,
}: {
  thread: CreatedThread;
  subforumId: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-16">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-1">¡Hilo publicado!</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tu hilo &ldquo;{thread.title}&rdquo; fue creado exitosamente.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" asChild>
          <Link href={`/subforos/${subforumId}`}>Volver al subforo</Link>
        </Button>
        <Button asChild>
          <Link href={`/subforos/${subforumId}/hilos/${thread.id}`}>Ver hilo</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NuevoHiloPage() {
  const params = useParams();
  const router = useRouter();
  const subforumId = params.subforumId as string;

  const [subforum, setSubforum] = useState<SubforumInfo | null>(null);
  const [loadingSubforum, setLoadingSubforum] = useState(true);
  const [subforumError, setSubforumError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({ title: '', content: '', tags: [] });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedThread | null>(null);

  useEffect(() => {
    async function loadSubforum() {
      try {
        const res = await fetch(`/api/subforums/${subforumId}`);
        if (!res.ok) throw new Error('Subforo no encontrado');
        const data: SubforumInfo = await res.json();
        setSubforum(data);
      } catch (err) {
        setSubforumError(err instanceof Error ? err.message : 'Error al cargar subforo');
      } finally {
        setLoadingSubforum(false);
      }
    }
    loadSubforum();
  }, [subforumId]);

  function handleTitleChange(value: string) {
    if (value.length > TITLE_MAX) return;
    setForm((prev) => ({ ...prev, title: value }));
    if (touched.has('title')) {
      setErrors((prev) => ({ ...prev, title: validateTitle(value) }));
    }
  }

  function handleContentChange(value: string) {
    setForm((prev) => ({ ...prev, content: value }));
    if (touched.has('content')) {
      setErrors((prev) => ({ ...prev, content: validateContent(value) }));
    }
  }

  function toggleTag(tag: string) {
    const next = form.tags.includes(tag)
      ? form.tags.filter((t) => t !== tag)
      : form.tags.length < 5
        ? [...form.tags, tag]
        : form.tags;
    setForm((prev) => ({ ...prev, tags: next }));
    if (touched.has('tags')) {
      setErrors((prev) => ({ ...prev, tags: validateTags(next) }));
    }
  }

  function markTouched(field: string) {
    setTouched((prev) => new Set(prev).add(field));
  }

  function handleBlur(field: 'title' | 'content') {
    markTouched(field);
    if (field === 'title') setErrors((prev) => ({ ...prev, title: validateTitle(form.title) }));
    if (field === 'content') setErrors((prev) => ({ ...prev, content: validateContent(form.content) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(new Set(['title', 'content', 'tags']));

    const newErrors: FormErrors = {
      title: validateTitle(form.title),
      content: validateContent(form.content),
      tags: validateTags(form.tags),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    const token = typeof window !== 'undefined' ? localStorage.getItem('mock-token') : null;

    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          tags: form.tags,
          subforumId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setErrors((prev) => ({
            ...prev,
            general: 'Necesitás iniciar sesión para publicar hilos.',
          }));
        } else if (res.status === 403) {
          setErrors((prev) => ({ ...prev, general: data.error }));
        } else if (res.status === 400 && data.details) {
          const fieldErrors: FormErrors = {};
          for (const [field, messages] of Object.entries(data.details)) {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[field as keyof FormErrors] = messages[0] as string;
            }
          }
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        } else {
          setErrors((prev) => ({
            ...prev,
            general: data.error ?? 'Error al publicar el hilo. Intentá de nuevo.',
          }));
        }
        return;
      }

      setCreated({ id: data.id, title: data.title, slug: data.slug });
    } catch {
      setErrors((prev) => ({ ...prev, general: 'Error de conexión. Intentá de nuevo.' }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with breadcrumb */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <nav
            className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap"
            aria-label="Ruta de navegación"
          >
            <Link href="/foros" className="hover:text-foreground transition-colors shrink-0">
              Foros
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            {subforum ? (
              <>
                <Link
                  href={`/subforos/${subforumId}`}
                  className="hover:text-foreground transition-colors truncate max-w-[160px] sm:max-w-xs"
                >
                  {subforum.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </>
            ) : null}
            <span className="text-foreground font-medium shrink-0">Nuevo hilo</span>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {created ? (
          <SuccessState thread={created} subforumId={subforumId} />
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight mb-6">Nuevo hilo</h1>

            {loadingSubforum && <FormSkeleton />}

            {!loadingSubforum && subforumError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {subforumError}
              </div>
            )}

            {!loadingSubforum && !subforumError && subforum && (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* General error */}
                {errors.general && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errors.general}</span>
                  </div>
                )}

                {/* ── Title ─────────────────────────────────────────────── */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">
                      Título <span className="text-destructive" aria-hidden>*</span>
                    </Label>
                    <span
                      className={cn(
                        'text-xs tabular-nums transition-colors',
                        form.title.length >= TITLE_MAX
                          ? 'text-destructive font-semibold'
                          : form.title.length >= TITLE_WARN
                            ? 'text-amber-600'
                            : 'text-muted-foreground'
                      )}
                      aria-live="polite"
                    >
                      {form.title.length}/{TITLE_MAX}
                    </span>
                  </div>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Escribí un título claro y descriptivo…"
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onBlur={() => handleBlur('title')}
                    aria-invalid={!!(touched.has('title') && errors.title)}
                    className={cn(
                      touched.has('title') &&
                        errors.title &&
                        'border-destructive focus-visible:ring-destructive/50'
                    )}
                  />
                  <FieldError message={touched.has('title') ? errors.title : undefined} />
                </div>

                {/* ── Content ───────────────────────────────────────────── */}
                <div className="space-y-1.5">
                  <Label htmlFor="content">
                    Contenido <span className="text-destructive" aria-hidden>*</span>
                  </Label>
                  <textarea
                    id="content"
                    rows={10}
                    placeholder="Describí tu consulta, aporte o tema de discusión con el mayor detalle posible…"
                    value={form.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onBlur={() => handleBlur('content')}
                    aria-invalid={!!(touched.has('content') && errors.content)}
                    className={cn(
                      'w-full resize-y rounded-md border border-input bg-transparent px-3 py-2.5 text-sm',
                      'placeholder:text-muted-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      'min-h-[180px]',
                      touched.has('content') &&
                        errors.content &&
                        'border-destructive focus-visible:ring-destructive/50'
                    )}
                  />
                  <FieldError message={touched.has('content') ? errors.content : undefined} />
                </div>

                {/* ── Tags ──────────────────────────────────────────────── */}
                {subforum.tags.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        Tags <span className="text-destructive" aria-hidden>*</span>
                      </Label>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {form.tags.length}/5 seleccionados
                      </span>
                    </div>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label="Seleccionar tags"
                    >
                      {subforum.tags.map((tag) => {
                        const selected = form.tags.includes(tag);
                        const maxed = !selected && form.tags.length >= 5;
                        return (
                          <button
                            key={tag}
                            type="button"
                            disabled={maxed}
                            onClick={() => {
                              toggleTag(tag);
                              markTouched('tags');
                            }}
                            aria-pressed={selected}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                              'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              selected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground',
                              maxed && 'opacity-40 cursor-not-allowed pointer-events-none'
                            )}
                          >
                            <Tag className="w-3 h-3 shrink-0" />
                            {tag}
                            {selected && <X className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <FieldError message={touched.has('tags') ? errors.tags : undefined} />
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                    Este subforo no tiene tags predefinidos.
                  </div>
                )}

                {/* ── Attach (visual only) ───────────────────────────────── */}
                <div>
                  <button
                    type="button"
                    disabled
                    title="Disponible próximamente"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-2.5 cursor-not-allowed opacity-60 select-none"
                  >
                    <Paperclip className="w-4 h-4 shrink-0" />
                    Adjuntar archivo
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full leading-none">
                      Próximamente
                    </span>
                  </button>
                </div>

                {/* ── Actions ───────────────────────────────────────────── */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSubmitting}
                    onClick={() => router.back()}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Publicando…' : 'Publicar hilo'}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
