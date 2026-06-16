// Lee la variable de entorno NEXT_PUBLIC_BFF_URL definida en .env.local
// .replace(/\/+$/, '') elimina cualquier "/" al final de la URL
// para evitar URLs dobles como http://localhost:4000//foros
// ?? '' significa: si la variable no existe, usar string vacío
const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL?.replace(/\/+$/, '') ?? ''

// Si la variable de entorno no está configurada, lanza un error al arrancar.
// Así detectamos el problema antes de que el usuario intente usar la app,
// en vez de que falle silenciosamente después.
if (!BFF_URL) {
  throw new Error('NEXT_PUBLIC_BFF_URL is not configured. Set it in .env.local or .env.example')
}

// Construye la URL completa del BFF combinando la base con el path.
// Ejemplo: getBffUrl('/foros') → 'http://localhost:4000/foros'
// cleanPath se asegura de que el path siempre empiece con '/'
// para evitar URLs mal formadas como 'http://localhost:4000foros'
export function getBffUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BFF_URL}${cleanPath}`
}

// En vez de escribir fetch('http://localhost:4000/foros') en cada componente,
// escribís bffFetch('/foros') y él construye la URL completa solo.
// init es opcional: permite pasar opciones como method, headers, body (para POST, etc.)
// Ventaja: si el BFF cambia de puerto o dominio, solo cambiás .env.local
// y toda la app se actualiza sin tocar ningún componente.
export function bffFetch(input: string, init?: RequestInit) {
  return fetch(getBffUrl(input), init)
}