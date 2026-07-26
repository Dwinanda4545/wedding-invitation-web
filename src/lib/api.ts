import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:8000'

function readCookie(name: string): string | null {
  const prefix = `${name}=`
  const parts = decodeURIComponent(document.cookie).split(';')

  for (const part of parts) {
    const cookie = part.trim()
    if (cookie.startsWith(prefix)) {
      return cookie.slice(prefix.length)
    }
  }

  return null
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

api.interceptors.request.use((config) => {
  const token = readCookie('XSRF-TOKEN')
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token
  }
  return config
})

export async function ensureCsrfCookie(): Promise<void> {
  await api.get('/sanctum/csrf-cookie')
}
