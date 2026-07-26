import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, ensureCsrfCookie } from '../lib/api'

export type AuthUser = {
  id: number
  name: string
  email: string
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: AuthUser }>('/api/me')
      setUser(data.user)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    void refreshMe().finally(() => setLoading(false))
  }, [refreshMe])

  const login = useCallback(async (email: string, password: string) => {
    await ensureCsrfCookie()
    const { data } = await api.post<{ user: AuthUser }>('/api/login', {
      email,
      password,
    })
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    await ensureCsrfCookie()
    await api.post('/api/logout')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshMe }),
    [user, loading, login, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
