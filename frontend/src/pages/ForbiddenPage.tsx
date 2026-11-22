import { Link } from 'react-router-dom'
import { AlertIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'

export function ForbiddenPage() {
  const { isAdmin } = useAuth()
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <AlertIcon className="mx-auto h-10 w-10 text-rose-500" />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">You do not have access to this area</h1>
      <p className="mt-2 text-sm text-slate-500">Your account role does not permit this action or route.</p>
      <Link to={isAdmin ? '/admin' : '/'} className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
        {isAdmin ? 'Back to admin' : 'Back to home'}
      </Link>
    </div>
  )
}
