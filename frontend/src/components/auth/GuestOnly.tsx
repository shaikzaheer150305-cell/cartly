import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { LoadingSpinner } from '../ui'
import { useAuth } from '../../context/AuthContext'

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner label="Checking session" /></div>
  }
  if (!user) return children
  return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />
}
