import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Input } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { applyZodErrors } from '../../lib/form'
import { safeRedirect } from '../../lib/utils'
import { errorMessage } from '../../services/api'

const schema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

type LoginValues = z.infer<typeof schema>

export function LoginPage() {
  const { login, isLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginValues>()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const onSubmit = async (values: LoginValues) => {
    setSubmitError(null)
    try {
      const parsed = schema.parse(values)
      const user = await login(parsed.email, parsed.password)
      const destination = safeRedirect(searchParams.get('redirect'), user.role === 'ADMIN' ? '/admin' : '/')
      showToast(`Welcome back, ${user.name}.`)
      navigate(destination, { replace: true })
    } catch (error) {
      if (error instanceof z.ZodError) {
        applyZodErrors(error, setError)
        return
      }
      setSubmitError(errorMessage(error))
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
      <div className="hidden bg-slate-900 p-10 text-white md:flex md:flex-col md:justify-between">
        <div>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-base font-bold">C</span>
          <h2 className="mt-8 text-3xl font-bold leading-tight">Welcome back to Cartly.</h2>
          <p className="mt-3 text-sm text-slate-300">Sign in to manage your cart, track orders or run the store.</p>
        </div>
        <p className="text-xs text-slate-400">Demo store — no real payments are processed.</p>
      </div>
      <div className="p-6 sm:p-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Log in</h1>
        <p className="mt-1 text-sm text-slate-500">Use your email and password to continue.</p>

        {submitError && <Alert variant="error" title="Unable to log in" className="mt-5">{submitError}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} helperText="At least 8 characters." {...register('password')} />
          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>Log in</Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          New here? <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Create an account</Link>
        </p>
        <p className="mt-3 text-center text-xs text-slate-400">Admin accounts are provisioned by the store owner.</p>
      </div>
    </div>
  )
}
