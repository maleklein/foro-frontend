'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { bffFetch } from '@/lib/bff';
import { cn } from '@/lib/utils';

// El botón puede estar en 4 estados:
//  - idle     : esperando un click
//  - loading  : sincronizando con el Backend Java vía el BFF
//  - success  : la sincronización terminó OK (se muestra unos segundos y vuelve a idle)
//  - error    : algo falló (se muestra unos segundos y vuelve a idle)
type Status = 'idle' | 'loading' | 'success' | 'error';

type SyncButtonProps = {
  // Se ejecuta cuando la sincronización termina con éxito. La página de foros
  // lo usa para volver a llamar a GET /foros y mostrar los datos actualizados.
  onSynced?: () => void;
};

// Texto que se muestra al usuario según el estado.
const LABEL: Record<Status, string> = {
  idle: 'Sincronizar',
  loading: 'Sincronizando…',
  success: 'Datos actualizados',
  error: 'Error al sincronizar',
};

// Cuánto tiempo se muestra el mensaje de "Datos actualizados" / "Error"
// antes de volver al estado idle. En milisegundos.
const FEEDBACK_DURATION_MS = 2000;

// Botón que dispara la sincronización Backend Java → MongoDB.
// Llama a GET /sync/foros del BFF; el BFF se encarga de traer los foros del
// backend relacional y guardarlos (upsert) en MongoDB. Al terminar, la página
// vuelve a leer /foros para mostrar la lista actualizada.
export function SyncButton({ onSynced }: SyncButtonProps) {
  const [status, setStatus] = useState<Status>('idle');

  async function handleSync() {
    // Evita disparar otro click mientras hay uno en curso.
    if (status === 'loading') return;

    setStatus('loading');

    try {
      const res = await bffFetch('/sync/foros');
      if (!res.ok) throw new Error(`BFF respondió ${res.status}`);

      setStatus('success');
      onSynced?.(); // refresca la lista de foros en la página
    } catch {
      setStatus('error');
    } finally {
      // Después del feedback, volvemos al estado idle para permitir otro sync.
      setTimeout(() => setStatus('idle'), FEEDBACK_DURATION_MS);
    }
  }

  // Elegimos el ícono según el estado para que el feedback visual sea claro.
  const Icon =
    status === 'success' ? CheckCircle2 : status === 'error' ? AlertCircle : RefreshCw;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={status === 'loading'}
      aria-busy={status === 'loading'}
      aria-label={LABEL[status]}
      title={LABEL[status]} // útil cuando la pantalla es chica y el texto se oculta
      className={cn(
        'min-h-9 shrink-0', // tap target cómodo en mobile
        status === 'success' && 'border-emerald-500 text-emerald-700',
        status === 'error' && 'border-destructive text-destructive',
      )}
    >
      <Icon
        className={cn(
          'size-4',
          // El ícono de refresh gira mientras está cargando — es el indicador
          // de loading que pide el issue.
          status === 'loading' && 'animate-spin',
        )}
      />
      {/* En mobile solo mostramos el ícono para ahorrar espacio. En sm+ aparece el texto. */}
      <span className="hidden sm:inline">{LABEL[status]}</span>
    </Button>
  );
}
