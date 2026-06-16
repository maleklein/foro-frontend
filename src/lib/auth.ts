// Nombre de la cookie donde guardamos la sesión del usuario
const COOKIE_NAME = 'foro_session'

// Forma de los datos que guardamos en la cookie
export type SessionData = {
  token: string   // token que devuelve el BFF al hacer login
  user: {
    id: string
    username: string
    email: string
    fullName: string
    role: string
    faculty: string | null  
    career: string | null  
  }
}

// Guarda los datos de sesión en una cookie del browser
export function setSessionCookie(data: SessionData): void {
  const value = encodeURIComponent(JSON.stringify(data))
  const maxAge = 60 * 60 * 24 * 7 // 7 días en segundos
  // Escribimos la cookie con su nombre, valor, duración y configuración de seguridad
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
}

// Lee la cookie y devuelve los datos del usuario, o null si no hay sesión
export function getSessionCookie(): SessionData | null {
  // Si estamos en el servidor (SSR), no hay document — devolvemos null
  if (typeof document === 'undefined') return null
  // Buscamos la cookie por su nombre
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  if (!match) return null
  try {
    // Decodificamos y parseamos el texto de vuelta a objeto
    return JSON.parse(decodeURIComponent(match[1])) as SessionData
  } catch {
    // Si la cookie está corrupta, la ignoramos
    return null
  }
}

// Shortcut para obtener solo el token sin el objeto completo
// Lo usamos cuando hacemos requests al BFF que requieren autenticación
export function getSessionToken(): string | null {
  return getSessionCookie()?.token ?? null
}

// Borra la cookie — se usa al cerrar sesión
export function clearSessionCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}