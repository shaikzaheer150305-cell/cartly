import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../services/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isCustomer: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: { name: string; email: string; password: string }) => Promise<User>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

const AUTH_KEY = 'cartly.auth'
const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): User | null {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function persistUser(user: User): void {
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  window.localStorage.setItem(`cartly.user.${user.id}`, JSON.stringify(user))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => readStoredUser())
  const [isLoading, setIsLoading] = useState(true)

  const setUser = useCallback((nextUser: User) => {
    setUserState(nextUser)
    persistUser(nextUser)
  }, [])

  useEffect(() => {
    let active = true
    void api.refresh()
      .then((restored) => {
        if (active) setUser(restored)
      })
      .catch(() => {
        if (active) setUserState(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [setUser])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const nextUser = await api.login(email, password)
      setUser(nextUser)
      return nextUser
    } finally {
      setIsLoading(false)
    }
  }, [setUser])

  const register = useCallback(async (input: { name: string; email: string; password: string }) => {
    setIsLoading(true)
    try {
      const nextUser = await api.register(input)
      setUser(nextUser)
      return nextUser
    } finally {
      setIsLoading(false)
    }
  }, [setUser])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      if (user) window.localStorage.removeItem(`cartly.user.${user.id}`)
      window.localStorage.removeItem(AUTH_KEY)
      setUserState(null)
    }
  }, [user])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'ADMIN',
    isCustomer: user?.role === 'CUSTOMER',
    isLoading,
    login,
    register,
    logout,
    setUser,
  }), [user, isLoading, login, register, logout, setUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
