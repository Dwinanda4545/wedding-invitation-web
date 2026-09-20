import axios from 'axios'

// Empty = same origin (Vite proxy). Prefer this locally for Sanctum CSRF.
const configured = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const baseURL = configured === undefined || configured === ''
  ? ''
  : configured

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
    'X-Requested-With': 'XMLHttpRequest',
  },
})

api.interceptors.request.use((config) => {
  const token = readCookie('XSRF-TOKEN')
  if (token) {
    config.headers.set('X-XSRF-TOKEN', token)
  }

  const isFormData =
    typeof FormData !== 'undefined' && config.data instanceof FormData

  if (isFormData) {
    // Browser must set multipart/form-data WITH boundary.
    // A bare "multipart/form-data" or "application/json" makes Laravel miss the file.
    config.headers.delete('Content-Type')
  } else if (
    config.data !== undefined &&
    config.data !== null &&
    typeof config.data !== 'string' &&
    !(config.data instanceof URLSearchParams) &&
    !config.headers.has('Content-Type')
  ) {
    config.headers.set('Content-Type', 'application/json')
  }

  return config
})

export async function ensureCsrfCookie(): Promise<void> {
  await api.get('/sanctum/csrf-cookie')
}

/** Multipart upload via fetch so Content-Type boundary is set by the browser. */
export async function uploadForm<T = unknown>(
  path: string,
  formData: FormData,
): Promise<T> {
  await ensureCsrfCookie()
  const token = readCookie('XSRF-TOKEN')
  const url = `${baseURL}${path.startsWith('/') ? path : `/${path}`}`

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { 'X-XSRF-TOKEN': token } : {}),
    },
    body: formData,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof (payload as { message: unknown }).message === 'string'
        ? (payload as { message: string }).message
        : `Upload failed (${response.status})`
    const error = new Error(message) as Error & {
      response?: { status: number; data: unknown }
    }
    error.response = { status: response.status, data: payload }
    throw error
  }

  return payload as T
}
