'use client'
// "use client" indica que este componente corre en el navegador (no en el servidor),
// necesario porque usa hooks de React y maneja eventos del usuario.

// --- IMPORTACIONES ---
import { useState } from 'react'
// useState: hook de React para guardar valores que, al cambiar, actualizan la pantalla.

import Link from 'next/link'
// Link: navega entre páginas de Next.js sin recargar el navegador.

import { Eye, EyeOff, Loader2 } from 'lucide-react'
// Íconos de lucide-react:
//   Eye    → ojo abierto (mostrar contraseña)
//   EyeOff → ojo tachado (ocultar contraseña)
//   Loader2 → spinner animado que indica carga

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Componentes reutilizables de UI del proyecto (botón e input estilizados).

// --- TIPO DE DATO: LoginResult ---
// Define la forma del objeto que devuelve el servidor cuando el login es exitoso.
// TypeScript usa esto para autocompletar y detectar errores en tiempo de desarrollo.
type LoginResult = {
  user: {
    id: string
    username: string
    email: string
    fullName: string
    role: string
    faculty: string | null  // puede ser null si el usuario no tiene facultad asignada
    career: string | null   // puede ser null si el usuario no tiene carrera asignada
  }
  token: string  // token de sesión que normalmente se guardaría para autenticar futuras peticiones
}

// --- COMPONENTE PRINCIPAL ---
export default function LoginPage() {

  // --- ESTADO LOCAL ---
  const [email, setEmail] = useState('')          // Email que escribe el usuario
  const [password, setPassword] = useState('')    // Contraseña que escribe el usuario
  const [showPassword, setShowPassword] = useState(false) // true = muestra la contraseña en texto plano
  const [loading, setLoading] = useState(false)   // true mientras espera respuesta del servidor
  const [error, setError] = useState<string | null>(null) // Mensaje de error (null = sin error)
  const [result, setResult] = useState<LoginResult | null>(null) // Datos del usuario logueado (null = aún no logueado)

  // --- FUNCIÓN QUE SE EJECUTA AL ENVIAR EL FORMULARIO ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()   // Evita que el navegador recargue la página al hacer submit
    setError(null)       // Limpia errores previos
    setResult(null)      // Limpia resultado previo (por si el usuario volvió a intentar)
    setLoading(true)     // Activa el spinner

    try {
      // Hace una petición POST al backend con email y contraseña como JSON.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json() // Convierte la respuesta del servidor a objeto JS

      if (!res.ok) {
        // Si el servidor devolvió error (ej. credenciales incorrectas),
        // muestra el mensaje de error. Si no viene uno, usa un mensaje genérico.
        setError(data.error ?? 'Error al iniciar sesión')
      } else {
        // Si el login fue exitoso, guarda los datos del usuario y el token.
        // Esto dispara el renderizado de la pantalla de bienvenida.
        setResult(data)
      }
    } catch {
      // Error de red (sin internet, servidor caído, etc.)
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      // Siempre se ejecuta: desactiva el spinner haya éxito o error.
      setLoading(false)
    }
  }

  // --- PANTALLA DE ÉXITO (POST-LOGIN) ---
  // Si result tiene datos, reemplaza el formulario con la info del usuario logueado.
  if (result) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">

        {/* Encabezado con ícono de tilde verde y nombre del usuario */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
            {/* SVG inline de un tilde (checkmark) */}
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">¡Bienvenido/a!</h2>
          <p className="text-sm text-muted-foreground">{result.user.fullName}</p>
        </div>

        {/* Tabla de datos del usuario: usuario, email, rol, y opcionalmente carrera y facultad */}
        <div className="space-y-0 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Usuario</span>
            <span className="font-medium">@{result.user.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{result.user.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Rol</span>
            <span className="font-medium capitalize">{result.user.role}</span>
          </div>
          {/* Carrera y facultad solo se muestran si el servidor las devolvió (no son null) */}
          {result.user.career && (
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Carrera</span>
              <span className="font-medium">{result.user.career}</span>
            </div>
          )}
          {result.user.faculty && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Facultad</span>
              <span className="font-medium">{result.user.faculty}</span>
            </div>
          )}
        </div>

        {/* Muestra el token de sesión que devolvió el servidor.
            En una app real esto no se mostraría; acá está visible porque es un mock de prueba. */}
        <div className="rounded-lg bg-muted p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Token de sesión (mock)</p>
          <p className="text-xs font-mono break-all text-foreground">{result.token}</p>
        </div>

        {/* Botón para volver al formulario de login: limpia result, email y password */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => { setResult(null); setEmail(''); setPassword('') }}
        >
          Volver al login
        </Button>
      </div>
    )
  }

  // --- FORMULARIO PRINCIPAL ---
  // Se muestra mientras result sea null (estado inicial o después de volver al login).
  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">

      {/* Encabezado del formulario */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Iniciar sesión</h2>
        <p className="text-sm text-muted-foreground">Ingresá con tu cuenta universitaria</p>
      </div>

      {/* Bloque de error: solo aparece si el estado `error` tiene un mensaje */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Campos del formulario: email y contraseña */}
      <div className="space-y-3">

        {/* Campo email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"                               // El navegador valida formato de email
            placeholder="tu@uap.edu.ar"
            value={email}                              // Valor controlado por el estado `email`
            onChange={(e) => setEmail(e.target.value)} // Actualiza el estado con cada tecla
            required
            disabled={loading}                         // Se desactiva mientras carga
            autoComplete="email"
          />
        </div>

        {/* Campo contraseña con botón para mostrar/ocultar */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Contraseña
          </label>
          <div className="relative">
            {/* El type cambia entre "password" (oculta) y "text" (visible) según showPassword */}
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="pr-9" // padding-right para que el texto no quede debajo del ícono ojo
            />
            {/* Botón ojo: posicionado en forma absoluta dentro del input.
                Alterna showPassword entre true/false al hacer click.
                tabIndex={-1} evita que el Tab del teclado llegue a este botón. */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Link para recuperar contraseña, alineado a la derecha */}
      <div className="flex justify-end">
        <Link
          href="/recover-password"
          className="text-sm text-primary hover:underline underline-offset-4"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {/* Botón de submit: muestra spinner + "Ingresando..." mientras loading es true */}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Ingresando...
          </>
        ) : (
          'Ingresar'
        )}
      </Button>
    </form>
  )
}
