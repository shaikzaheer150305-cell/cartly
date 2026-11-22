import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { LoadingSpinner } from '../ui'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types'

export function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner label="Checking session" /></div>
  }
  if (!user) {
    const intended = `${location.pathname}${location.search}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(intended)}`} replace />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }
  return children
}
