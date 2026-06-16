'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { bffFetch } from '@/lib/bff';
import { getSessionToken } from '@/lib/auth';
import { cn } from '@/lib/utils';

// Endpoint del BFF para crear foros. bffFetch antepone NEXT_PUBLIC_BFF_URL,
// igual que la carga de foros (GET /foros) y el resto de la app.
const FOROS_ENDPOINT = '/foros';

// ─── Facultades disponibles ─────────────────────────────────────────────────────
// Coinciden con las claves que usa la página de foros para agrupar y mostrar badges.
const FACULTIES = [
  { value: 'humanidades', label: 'Facultad de Humanidades' },
  { value: 'economicas', label: 'Facultad de Cs. Económicas' },
  { value: 'teologia', label: 'Facultad de Teología' },
  { value: 'salud', label: 'Facultad de Cs. de la Salud' },
  { value: 'instituto', label: 'Instituto Superior' },
  { value: 'preuniversitario', label: 'Preuniversitario' },
  { value: 'general', label: 'General' },
];
// ─── Tipos ──────────────────────────────────────────────────────────────────────
type FormState = { name: string; description: string; faculty: string };
type FormErrors = { name?: string; description?: string; faculty?: string; general?: string };
type CreatedForum = { _id: string; nombre: string };

// ─── Validaciones client-side (campos no vacíos) ────────────────────────────────
function validateName(v: string): string | undefined {
  if (!v.trim()) return 'El nombre es requerido';
  if (v.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
  if (v.length > 100) return 'El nombre no puede exceder 100 caracteres';
}

function validateDescription(v: string): string | undefined {
  if (!v.trim()) return 'La descripción es requerida';
  if (v.length > 500) return 'La descripción no puede exceder 500 caracteres';
}

function validateFaculty(v: string): string | undefined {
  if (!v.trim()) return 'Seleccioná una facultad';
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-sm text-destructive mt-1" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

const EMPTY_FORM: FormState = { name: '', description: '', faculty: '' };

// ─── Componente ─────────────────────────────────────────────────────────────────
export function CreateForumDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedForum | null>(null);

  // Resetea el formulario a su estado inicial.
  function resetForm() {
    setForm(EMPTY_FORM);
    setErrors({});
    setCreated(null);
    setIsSubmitting(false);
  }

  // Al abrir/cerrar el diálogo limpiamos cualquier estado previo.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validación client-side de todos los campos.
    const newErrors: FormErrors = {
      name: validateName(form.name),
      description: validateDescription(form.description),
      faculty: validateFaculty(form.faculty),
    };
    setErrors(newErrors);
    if (newErrors.name || newErrors.description || newErrors.faculty) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    const token = getSessionToken();

    try {
      const res = await bffFetch(FOROS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nombre: form.name.trim(),
          descripcion: form.description.trim(),
          facultad: form.faculty,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setErrors((prev) => ({
            ...prev,
            general: 'Necesitás iniciar sesión para crear foros.',
          }));
        } else if (res.status === 400 && data.details) {
          // Errores de validación del servidor mapeados por campo.
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
            general: data.error ?? 'No se pudo crear el foro. Intentá de nuevo.',
          }));
        }
        return;
      }

      // 201: foro creado correctamente.
      setCreated({ _id: data._id, nombre: data.nombre });
      onCreated?.(); // refresca la lista de foros en la página
    } catch {
      setErrors((prev) => ({ ...prev, general: 'Error de conexión. Intentá de nuevo.' }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Crear foro
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {created ? (
          // ── Estado de éxito ──────────────────────────────────────────────
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Foro creado</h2>
              <p className="text-sm text-muted-foreground">
                El foro &ldquo;{created.nombre}&rdquo; se creó correctamente.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Crear otro
              </Button>
              <Button size="sm" onClick={() => handleOpenChange(false)}>
                Listo
              </Button>
            </div>
          </div>
        ) : (
          // ── Formulario ───────────────────────────────────────────────────
          <>
            <DialogHeader>
              <DialogTitle>Crear nuevo foro</DialogTitle>
              <DialogDescription>
                Completá los datos para crear un nuevo foro de discusión.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Error general */}
              {errors.general && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Nombre */}
              <div className="space-y-1.5">
                <Label htmlFor="forum-name">
                  Nombre <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <Input
                  id="forum-name"
                  type="text"
                  placeholder="Ej: Ingeniería Informática"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  aria-invalid={!!errors.name}
                  disabled={isSubmitting}
                  className={cn(errors.name && 'border-destructive focus-visible:ring-destructive/50')}
                />
                <FieldError message={errors.name} />
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <Label htmlFor="forum-description">
                  Descripción <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <textarea
                  id="forum-description"
                  rows={3}
                  placeholder="Describí brevemente de qué trata este foro…"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  aria-invalid={!!errors.description}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm',
                    'placeholder:text-muted-foreground',
                    'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'min-h-[80px]',
                    errors.description && 'border-destructive focus-visible:ring-destructive/50'
                  )}
                />
                <FieldError message={errors.description} />
              </div>

              {/* Facultad */}
              <div className="space-y-1.5">
                <Label htmlFor="forum-faculty">
                  Facultad <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <Select
                  value={form.faculty}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, faculty: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="forum-faculty"
                    className="w-full"
                    aria-invalid={!!errors.faculty}
                  >
                    <SelectValue placeholder="Seleccioná una facultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACULTIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.faculty} />
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Creando…
                    </>
                  ) : (
                    'Crear foro'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
