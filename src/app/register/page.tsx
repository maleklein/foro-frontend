'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// ─── Datos UAP ───────────────────────────────────────────────────────────────

const FACULTIES = [
  { id: 'FCI', label: 'FCI — Ciencias de la Información' },
  { id: 'FCE', label: 'FCE — Ciencias Empresariales' },
  { id: 'FCS', label: 'FCS — Ciencias de la Salud' },
  { id: 'FT', label: 'FT — Teología' },
  { id: 'FACED', label: 'FACED — Educación' },
]

const CAREERS: Record<string, string[]> = {
  FCI: [
    'Lic. en Informática',
    'Lic. en Sistemas de Información',
    'Tecnicatura en Programación',
    'Lic. en Diseño Gráfico',
  ],
  FCE: [
    'Contador Público Nacional',
    'Lic. en Administración de Empresas',
    'Lic. en Turismo y Hotelería',
    'Tecnicatura en Recursos Humanos',
  ],
  FCS: [
    'Lic. en Enfermería',
    'Lic. en Nutrición',
    'Lic. en Kinesiología y Fisiatría',
    'Lic. en Terapia Ocupacional',
  ],
  FT: [
    'Lic. en Teología',
    'Bachillerato en Teología',
    'Ministerio Pastoral',
  ],
  FACED: [
    'Profesorado de Educación Inicial',
    'Profesorado de Educación Primaria',
    'Lic. en Psicopedagogía',
    'Profesorado de Inglés',
  ],
}

// años de más reciente a más antiguo
const ENTRY_YEARS = Array.from({ length: 12 }, (_, i) => String(2026 - i))

// ─── Validaciones ────────────────────────────────────────────────────────────

function validateUsername(v: string) {
  if (!v) return 'El nombre de usuario es requerido'
  if (v.length < 3) return 'Mínimo 3 caracteres'
  if (v.length > 30) return 'Máximo 30 caracteres'
  if (/\s/.test(v)) return 'No puede contener espacios'
  if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Solo letras, números y guiones bajos (_)'
  return undefined
}

function validateEmail(v: string) {
  if (!v) return 'El correo electrónico es requerido'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Formato de correo inválido'
  return undefined
}

function validatePassword(v: string) {
  if (!v) return 'La contraseña es requerida'
  if (v.length < 8) return 'Mínimo 8 caracteres'
  if (!/[A-Z]/.test(v)) return 'Debe contener al menos una mayúscula'
  if (!/[a-z]/.test(v)) return 'Debe contener al menos una minúscula'
  if (!/[0-9]/.test(v)) return 'Debe contener al menos un número'
  return undefined
}

function validateConfirmPassword(v: string, password: string) {
  if (!v) return 'Confirmá tu contraseña'
  if (v !== password) return 'Las contraseñas no coinciden'
  return undefined
}

function validateFullName(v: string) {
  if (!v || v.trim().length < 3) return 'El nombre completo es requerido (mín. 3 caracteres)'
  return undefined
}

function validateBirthDate(v: string) {
  if (!v) return 'La fecha de nacimiento es requerida'
  const date = new Date(v)
  if (isNaN(date.getTime())) return 'Fecha inválida'
  const age = new Date().getFullYear() - date.getFullYear()
  if (age < 16) return 'Debés tener al menos 16 años'
  return undefined
}

function validateRequired(v: string, label: string) {
  return v ? undefined : `${label} es requerido`
}

// ─── Fortaleza de contraseña ─────────────────────────────────────────────────

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const levels = [
    { label: '', color: '' },
    { label: 'Muy débil', color: 'bg-red-500' },
    { label: 'Regular', color: 'bg-orange-400' },
    { label: 'Buena', color: 'bg-yellow-400' },
    { label: 'Muy fuerte', color: 'bg-green-500' },
  ]
  return { score, ...levels[score] }
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface FormState {
  username: string
  fullName: string
  email: string
  password: string
  confirmPassword: string
  birthDate: string
  sex: string
  faculty: string
  career: string
  entryYear: string
  captcha: boolean
}

interface FormErrors {
  username?: string
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  birthDate?: string
  sex?: string
  faculty?: string
  career?: string
  entryYear?: string
  captcha?: string
  general?: string
}

const INITIAL_FORM: FormState = {
  username: '',
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  birthDate: '',
  sex: '',
  faculty: '',
  career: '',
  entryYear: '',
  captcha: false,
}

// ─── Componente auxiliar: mensaje de error de campo ──────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="flex items-center gap-1 text-sm text-destructive mt-1" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  )
}

// ─── Componente auxiliar: título de sección ───────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 pb-2 border-b">
      {children}
    </h2>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

  const passwordStrength = getPasswordStrength(form.password)
  const availableCareers = CAREERS[form.faculty] ?? []

  const maxBirthDate = new Date()
  maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 16)
  const maxBirthDateStr = maxBirthDate.toISOString().split('T')[0]

  function validateField(name: string, value: string | boolean): string | undefined {
    switch (name) {
      case 'username': return validateUsername(value as string)
      case 'fullName': return validateFullName(value as string)
      case 'email': return validateEmail(value as string)
      case 'password': return validatePassword(value as string)
      case 'confirmPassword': return validateConfirmPassword(value as string, form.password)
      case 'birthDate': return validateBirthDate(value as string)
      case 'sex': return validateRequired(value as string, 'El sexo')
      case 'faculty': return validateRequired(value as string, 'La facultad')
      case 'career': return validateRequired(value as string, 'La carrera')
      case 'entryYear': return validateRequired(value as string, 'El año de ingreso')
      case 'captcha': return value ? undefined : 'Por favor completá la verificación'
      default: return undefined
    }
  }

  function validateAll(): FormErrors {
    return {
      username: validateField('username', form.username),
      fullName: validateField('fullName', form.fullName),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      confirmPassword: validateField('confirmPassword', form.confirmPassword),
      birthDate: validateField('birthDate', form.birthDate),
      sex: validateField('sex', form.sex),
      faculty: validateField('faculty', form.faculty),
      career: validateField('career', form.career),
      entryYear: validateField('entryYear', form.entryYear),
      captcha: validateField('captcha', form.captcha),
    }
  }

  function handleChange(name: keyof FormState, value: string | boolean) {
    const updated = { ...form, [name]: value }
    if (name === 'faculty') updated.career = ''
    setForm(updated)

    if (touched.has(name)) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
    // revalidar confirmPassword cuando cambia password
    if (name === 'password' && touched.has('confirmPassword')) {
      const confirmError = validateConfirmPassword(updated.confirmPassword, value as string)
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }))
    }
  }

  function handleBlur(name: string) {
    setTouched(prev => new Set(prev).add(name))
    const value = form[name as keyof FormState]
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
  }

  function touch(name: string) {
    setTouched(prev => new Set(prev).add(name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(new Set(Object.keys(INITIAL_FORM)))

    const newErrors = validateAll()
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    setIsSubmitting(true)
    setErrors(prev => ({ ...prev, general: undefined }))

    const sexApiMap: Record<string, string> = {
      M: 'M',
      F: 'F',
      Otro: 'Otro',
      PREFER_NOT: 'Otro',
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          birthDate: form.birthDate,
          sex: sexApiMap[form.sex] ?? form.sex,
          faculty: form.faculty,
          career: form.career,
          entryYear: parseInt(form.entryYear, 10),
          captchaToken: form.captcha ? 'mock-captcha-verified' : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setErrors(prev => ({ ...prev, general: data.error }))
        } else if (res.status === 400 && data.details) {
          const fieldErrors: FormErrors = {}
          for (const [field, messages] of Object.entries(data.details)) {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[field as keyof FormErrors] = messages[0] as string
            }
          }
          setErrors(prev => ({ ...prev, ...fieldErrors }))
        } else {
          setErrors(prev => ({ ...prev, general: data.error ?? 'Error al registrarse' }))
        }
        return
      }

      setRegistered(true)
    } catch {
      setErrors(prev => ({ ...prev, general: 'Error de conexión. Intentá de nuevo.' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Estado de éxito ──────────────────────────────────────────────────────────

  if (registered) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6 bg-card border rounded-2xl shadow-sm p-10">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-5">
              <CheckCircle2 className="h-14 w-14 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">¡Registro exitoso!</h1>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              Revisá tu email para confirmar tu cuenta antes de iniciar sesión.
            </p>
          </div>
          <Link href="/login">
            <Button className="w-full" size="lg">
              Ir al inicio de sesión
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  // ── Formulario ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-muted/30 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4 select-none">
            UAP
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Crear cuenta</h1>
          <p className="mt-1.5 text-muted-foreground text-sm">
            Completá tus datos para unirte al foro UAP
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-card border rounded-2xl shadow-sm px-6 py-8 sm:px-10">
          <form onSubmit={handleSubmit} noValidate>

            {/* Error general */}
            {errors.general && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errors.general}
              </div>
            )}

            <div className="space-y-8">

              {/* ── Información de cuenta ────────────────────────────────── */}
              <section>
                <SectionTitle>Información de cuenta</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">

                  {/* Username */}
                  <div className="space-y-1.5">
                    <Label htmlFor="username">
                      Nombre de usuario <span className="text-destructive" aria-hidden>*</span>
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="mi_alias"
                      value={form.username}
                      onChange={e => handleChange('username', e.target.value)}
                      onBlur={() => handleBlur('username')}
                      aria-invalid={!!(touched.has('username') && errors.username)}
                      className={cn(
                        touched.has('username') && errors.username &&
                        'border-destructive focus-visible:ring-destructive/50'
                      )}
                      autoComplete="username"
                    />
                    <p className="text-xs text-muted-foreground">Mín. 3 caracteres · sin espacios · público</p>
                    <FieldError message={touched.has('username') ? errors.username : undefined} />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">
                      Correo electrónico <span className="text-destructive" aria-hidden>*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      aria-invalid={!!(touched.has('email') && errors.email)}
                      className={cn(
                        touched.has('email') && errors.email &&
                        'border-destructive focus-visible:ring-destructive/50'
                      )}
                      autoComplete="email"
                    />
                    <FieldError message={touched.has('email') ? errors.email : undefined} />
                  </div>

                  {/* Nombre completo — ancho completo */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="fullName">
                      Nombre completo{' '}
                      <span className="text-destructive" aria-hidden>*</span>
                      <span className="ml-1 text-xs font-normal text-muted-foreground">(privado)</span>
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Ana García"
                      value={form.fullName}
                      onChange={e => handleChange('fullName', e.target.value)}
                      onBlur={() => handleBlur('fullName')}
                      aria-invalid={!!(touched.has('fullName') && errors.fullName)}
                      className={cn(
                        touched.has('fullName') && errors.fullName &&
                        'border-destructive focus-visible:ring-destructive/50'
                      )}
                      autoComplete="name"
                    />
                    <FieldError message={touched.has('fullName') ? errors.fullName : undefined} />
                  </div>

                </div>
              </section>

              {/* ── Contraseña ───────────────────────────────────────────── */}
              <section>
                <SectionTitle>Contraseña</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password">
                      Contraseña <span className="text-destructive" aria-hidden>*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={e => handleChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        aria-invalid={!!(touched.has('password') && errors.password)}
                        className={cn(
                          'pr-10',
                          touched.has('password') && errors.password &&
                          'border-destructive focus-visible:ring-destructive/50'
                        )}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        tabIndex={-1}
                      >
                        {showPassword
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FieldError message={touched.has('password') ? errors.password : undefined} />
                  </div>

                  {/* Confirmar password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">
                      Confirmar contraseña <span className="text-destructive" aria-hidden>*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={e => handleChange('confirmPassword', e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        aria-invalid={!!(touched.has('confirmPassword') && errors.confirmPassword)}
                        className={cn(
                          'pr-10',
                          touched.has('confirmPassword') && errors.confirmPassword &&
                          'border-destructive focus-visible:ring-destructive/50'
                        )}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        tabIndex={-1}
                      >
                        {showConfirm
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FieldError message={touched.has('confirmPassword') ? errors.confirmPassword : undefined} />
                  </div>

                  {/* Indicador de fortaleza */}
                  {form.password && (
                    <div className="sm:col-span-2 space-y-2" aria-live="polite">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Fortaleza de la contraseña</span>
                        <span className={cn(
                          'text-xs font-semibold transition-colors',
                          passwordStrength.score === 1 && 'text-red-500',
                          passwordStrength.score === 2 && 'text-orange-500',
                          passwordStrength.score === 3 && 'text-yellow-600',
                          passwordStrength.score === 4 && 'text-green-600',
                        )}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="flex gap-1" role="presentation">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={cn(
                              'h-1.5 flex-1 rounded-full transition-all duration-300',
                              i <= passwordStrength.score
                                ? passwordStrength.color
                                : 'bg-muted'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mín. 8 caracteres · 1 mayúscula · 1 minúscula · 1 número
                      </p>
                    </div>
                  )}

                </div>
              </section>

              {/* ── Datos personales ─────────────────────────────────────── */}
              <section>
                <SectionTitle>Datos personales</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">

                  {/* Fecha de nacimiento */}
                  <div className="space-y-1.5">
                    <Label htmlFor="birthDate">
                      Fecha de nacimiento <span className="text-destructive" aria-hidden>*</span>
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={form.birthDate}
                      max={maxBirthDateStr}
                      onChange={e => handleChange('birthDate', e.target.value)}
                      onBlur={() => handleBlur('birthDate')}
                      aria-invalid={!!(touched.has('birthDate') && errors.birthDate)}
                      className={cn(
                        touched.has('birthDate') && errors.birthDate &&
                        'border-destructive focus-visible:ring-destructive/50'
                      )}
                    />
                    <FieldError message={touched.has('birthDate') ? errors.birthDate : undefined} />
                  </div>

                  {/* Sexo */}
                  <div className="space-y-1.5">
                    <Label htmlFor="sex-trigger">
                      Sexo <span className="text-destructive" aria-hidden>*</span>
                    </Label>
                    <Select
                      value={form.sex}
                      onValueChange={val => { handleChange('sex', val); touch('sex') }}
                    >
                      <SelectTrigger
                        id="sex-trigger"
                        aria-invalid={!!(touched.has('sex') && errors.sex)}
                        className={cn(
                          touched.has('sex') && errors.sex &&
                          'border-destructive focus-visible:ring-destructive/50'
                        )}
                      >
                        <SelectValue placeholder="Seleccioná..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                        <SelectItem value="PREFER_NOT">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError message={touched.has('sex') ? errors.sex : undefined} />
                  </div>

                </div>
              </section>

              {/* ── Información académica ─────────────────────────────────── */}
              <section>
                <SectionTitle>Información académica</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">

                  {/* Facultad */}
                  <div className="space-y-1.5">
                    <Label htmlFor="faculty-trigger">
                      Facultad <span className="text-destructive" aria-hidden>*</span>
                    </Label>
                    <Select
                      value={form.faculty}
                      onValueChange={val => { handleChange('faculty', val); touch('faculty') }}
                    >
                      <SelectTrigger
                        id="faculty-trigger"
                        aria-invalid={!!(touched.has('faculty') && errors.faculty)}
                        className={cn(
                          touched.has('faculty') && errors.faculty &&
                          'border-destructive focus-visible:ring-destructive/50'
                        )}
                      >
                        <SelectValue placeholder="Seleccioná tu facultad..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FACULTIES.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={touched.has('faculty') ? errors.faculty : undefined} />
                  </div>

                  {/* Carrera — filtrada por facultad */}
                  <div className="space-y-1.5">
                    <Label htmlFor="career-trigger">
                      Carrera <span className="text-destructive" aria-hidden>*</span>
                    </Label>
                    <Select
                      value={form.career}
                      onValueChange={val => { handleChange('career', val); touch('career') }}
                      disabled={!form.faculty}
                    >
                      <SelectTrigger
                        id="career-trigger"
                        aria-invalid={!!(touched.has('career') && errors.career)}
                        className={cn(
                          touched.has('career') && errors.career &&
                          'border-destructive focus-visible:ring-destructive/50'
                        )}
                      >
                        <SelectValue
                          placeholder={
                            form.faculty ? 'Seleccioná tu carrera...' : 'Primero elegí una facultad'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCareers.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={touched.has('career') ? errors.career : undefined} />
                  </div>

                  {/* Año de ingreso */}
                  <div className="space-y-1.5">
                    <Label htmlFor="entry-year-trigger">
                      Año de ingreso <span className="text-destructive" aria-hidden>*</span>
                    </Label>
                    <Select
                      value={form.entryYear}
                      onValueChange={val => { handleChange('entryYear', val); touch('entryYear') }}
                    >
                      <SelectTrigger
                        id="entry-year-trigger"
                        aria-invalid={!!(touched.has('entryYear') && errors.entryYear)}
                        className={cn(
                          touched.has('entryYear') && errors.entryYear &&
                          'border-destructive focus-visible:ring-destructive/50'
                        )}
                      >
                        <SelectValue placeholder="Año..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTRY_YEARS.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={touched.has('entryYear') ? errors.entryYear : undefined} />
                  </div>

                </div>
              </section>

              {/* ── Verificación (CAPTCHA mock) ───────────────────────────── */}
              <section>
                <SectionTitle>Verificación</SectionTitle>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-4 py-3.5 transition-colors select-none',
                    touched.has('captcha') && errors.captcha
                      ? 'border-destructive bg-destructive/5'
                      : 'border-border bg-muted/40'
                  )}
                >
                  <Checkbox
                    id="captcha"
                    checked={form.captcha}
                    onCheckedChange={checked => {
                      handleChange('captcha', !!checked)
                      touch('captcha')
                    }}
                    aria-invalid={!!(touched.has('captcha') && errors.captcha)}
                  />
                  <Label
                    htmlFor="captcha"
                    className="cursor-pointer text-sm font-medium flex-1"
                  >
                    No soy un robot
                  </Label>
                  <div className="flex items-center gap-1.5 text-muted-foreground border-l pl-3">
                    <ShieldCheck className="h-5 w-5" />
                    <div className="text-right leading-none">
                      <p className="text-[10px] font-mono font-semibold">reCAPTCHA</p>
                      <p className="text-[9px] font-mono opacity-60">mock v3</p>
                    </div>
                  </div>
                </div>
                <FieldError message={touched.has('captcha') ? errors.captcha : undefined} />
              </section>

            </div>

            {/* ── Botón de envío ────────────────────────────────────────── */}
            <div className="mt-8 space-y-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tenés cuenta?{' '}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Iniciá sesión
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </main>
  )
}
