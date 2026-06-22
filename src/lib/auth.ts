// Nombre de la cookie donde guardamos la sesión del usuario
const COOKIE_NAME = 'foro_session'

// Forma de los datos que guardamos en la cookie.
// Coincide 1:1 con la respuesta del BFF `POST /auth/login`:
//   { user: { id, email, username, role } }
// No incluye `token` porque la autenticación entre el browser y el BFF
// la maneja el BFF con una cookie HttpOnly aparte (la setea él mismo en
// la respuesta del login). Esta cookie de acá es solo para datos
// visibles del usuario (nombre, rol) y para saber si hay sesión activa.
export type SessionData = {
  user: {
    id: string
    email: string
    username: string
    role: string
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

// Borra la cookie — se usa al cerrar sesión
export function clearSessionCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}
