'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { bffFetch } from '@/lib/bff'
import { setSessionCookie } from '@/lib/auth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  //  Función que se ejecuta cuando el usuario envía un formulario
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault() // evita que el navegador recargue la página y pierda los datos. Ya que es un comportamiento normal al submitear.
    setError(null) // se borran los errores anteriores
    setLoading(true) // se muestra el spinner mientras se espera la respuesta del bff

    try {
      // credentials: 'include' hace que el browser acepte y persista la
      // cookie HttpOnly de sesión que el BFF setea en la respuesta del
      // login. Es lo que mantiene autenticadas las requests siguientes.
      const res = await bffFetch('/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.error ?? 'Error al iniciar sesión')
      } else {
        // Guardamos los datos del usuario en una cookie del browser (legible
        // por JS, distinta a la HttpOnly del BFF) para poder mostrar el
        // nombre, el rol, y saber si hay sesión activa sin pegarle al BFF.
        setSessionCookie({ user: data.user })
        router.push('/foros') // y redirige al usuario
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.') // se ejecuta si el BFF no está corriendo, sin internet, etc
    } finally { // salga bien o salga mal, se desactiva el spinner
      setLoading(false)
    }
  }

  // Renderizado
  return (
    // onSubmit conecta el formulario con handleSubmit — se ejecuta al apretar Ingresar o Enter
    // aria-busy le avisa a lectores de pantalla que el form está en proceso
    <form
      onSubmit={handleSubmit}
      aria-busy={loading}
      className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5"
    >

      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Iniciar sesión</h2>
        <p className="text-sm text-muted-foreground">Ingresá con tu cuenta universitaria</p>
      </div>

      {error && (
        // role="alert" hace que los lectores de pantalla anuncien el error apenas aparece
        <div
          role="alert"
          className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="space-y-3">

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email" // el navegador valida el formato de email. Haciendo aparececer una ventana de error
            placeholder="tu@uap.edu.ar"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Contraseña
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'} // input que reacciona al estado. Si showPassword es false (o sea type = password), el navegador automaticamente muestra puntos negros.
              // Si showPassword es true --> type="text" --> se ve la contraseña.
              // Si showPassword es false --> type="password"--> se ven los puntitos.
              placeholder="••••••••" // texto que aparece solo cuando está vacío el input.
              value={password} // vincula el input con el estado password mostrando en el input lo que relfeja el valor actual del estado.
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              className="pr-10"
            />
            {/*
              Botón del ojo posicionado en la esquina derecha del input.
              - absolute + right-1 + inset-y-1: centrado vertical sin tener que usar translate
              - h-8 w-8: tap-target de 32px (mínimo cómodo en mobile sin agrandar el input)
              - aria-label: lectores de pantalla anuncian qué hace el botón
              - aria-pressed: comunica el estado (true cuando la pass está visible)
            */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              className="absolute right-1 inset-y-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/recover-password"
          className="text-sm text-primary hover:underline underline-offset-4 py-1"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

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
