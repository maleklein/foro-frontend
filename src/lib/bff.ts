const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL?.replace(/\/+$/, '') ?? ''

if (!BFF_URL) {
  throw new Error('NEXT_PUBLIC_BFF_URL is not configured. Set it in .env.local or .env.example')
}

export function getBffUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BFF_URL}${cleanPath}`
}

export function bffFetch(input: string, init?: RequestInit) {
  return fetch(getBffUrl(input), init)
}
