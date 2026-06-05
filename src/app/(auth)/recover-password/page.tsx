'use client'
// "use client" le dice a Next.js que este componente se ejecuta en el navegador (cliente),
// no en el servidor. Es necesario porque usa hooks de React como useState y maneja eventos.

// --- IMPORTACIONES ---
import { useState } from 'react'
// useState: hook de React para guardar y actualizar valores dentro del componente.

import Link from 'next/link'
// Link: componente de Next.js para navegar entre páginas sin recargar la página completa.

import { ArrowLeft, Loader2, Mail } from 'lucide-react'
// Íconos de la librería lucide-react:
//   ArrowLeft → flecha hacia la izquierda (botón "volver")
//   Loader2   → ícono de carga que se anima con spin
//   Mail      → ícono de sobre/email (pantalla de éxito)

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Componentes reutilizables de la UI del proyecto (botón e input estilizados).

// --- COMPONENTE PRINCIPAL ---
export default function RecoverPasswordPage() {

  // --- ESTADO LOCAL ---
  // Cada useState guarda un valor que, al cambiar, hace que el componente se re-renderice.
  const [email, setEmail] = useState('')         // Email que escribe el usuario
  const [loading, setLoading] = useState(false)  // true mientras espera respuesta del servidor
  const [error, setError] = useState<string | null>(null) // Mensaje de error (null = sin error)
  const [success, setSuccess] = useState(false)  // true cuando el servidor respondió con éxito
  const [message, setMessage] = useState('')     // Mensaje de confirmación que llega del servidor

  // --- FUNCIÓN QUE SE EJECUTA AL ENVIAR EL FORMULARIO ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()    // Evita que el navegador recargue la página al hacer submit
    setError(null)        // Limpia cualquier error previo
    setLoading(true)      // Activa el estado de carga (muestra el spinner)

    try {
      // Hace una petición POST a la ruta del backend /api/auth/recover-password,
      // enviando el email del usuario en el cuerpo como JSON.
      const res = await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json() // Convierte la respuesta del servidor a objeto JS

      if (!res.ok) {
        // Si el servidor devolvió un error (ej. email no registrado),
        // muestra el mensaje de error. Si no viene mensaje, usa uno genérico.
        setError(data.error ?? 'Error al procesar la solicitud')
      } else {
        // Si todo salió bien, guarda el mensaje de confirmación y activa la pantalla de éxito.
        setMessage(data.message)
        setSuccess(true)
      }
    } catch {
      // Si hubo un problema de red (sin internet, servidor caído, etc.)
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      // Siempre se ejecuta, haya error o no: desactiva el spinner de carga.
      setLoading(false)
    }
  }

  // --- PANTALLA DE ÉXITO ---
  // Si success es true, en lugar del formulario se muestra esta pantalla de confirmación.
  if (success) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5 text-center">
        {/* Ícono de sobre centrado con fondo suave */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
          <Mail className="w-6 h-6 text-primary" />
        </div>

        {/* Título y mensaje que vino del servidor */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Revisá tu correo</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {/* Botón para volver al login */}
        <Link href="/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="size-4" />
            Volver al login
          </Button>
        </Link>
      </div>
    )
  }

  // --- FORMULARIO PRINCIPAL ---
  // Se muestra mientras success sea false (estado inicial).
  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">

      {/* Encabezado: título y descripción del formulario */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Recuperar contraseña</h2>
        <p className="text-sm text-muted-foreground">
          Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
        </p>
      </div>

      {/* Bloque de error: solo se renderiza si hay un mensaje de error en el estado */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Campo de email con su etiqueta */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"               // El navegador valida que tenga formato de email
          placeholder="tu@uap.edu.ar"
          value={email}              // Controlado por el estado: muestra lo que hay en `email`
          onChange={(e) => setEmail(e.target.value)} // Actualiza `email` con cada tecla
          required                   // El formulario no se puede enviar si está vacío
          disabled={loading}         // Se desactiva mientras carga para evitar doble envío
          autoComplete="email"       // Sugiere emails guardados en el navegador
        />
      </div>

      {/* Botón de envío: muestra spinner + "Enviando..." mientras loading es true */}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar enlace'
        )}
      </Button>

      {/* Link para volver al login sin enviar el formulario */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Volver al login
        </Link>
      </div>
    </form>
  )
}
