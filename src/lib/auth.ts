const COOKIE_NAME = 'foro_session'

export type SessionData = {
  user: {
    id: string
    email: string
    username: string
    role: string
  }
}

export function setSessionCookie(data: SessionData): void {
  const value = encodeURIComponent(JSON.stringify(data))
  const maxAge = 60 * 60 * 24 * 7
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function getSessionCookie(): SessionData | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1])) as SessionData
  } catch {
    return null
  }
}

export function clearSessionCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}