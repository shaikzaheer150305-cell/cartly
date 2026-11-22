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
  name: z.string().min(2, 'Enter your full name.'),
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
})

type RegisterValues = z.infer<typeof schema>

export function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<RegisterValues>()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const onSubmit = async (values: RegisterValues) => {
    setSubmitError(null)
    try {
      const parsed = schema.parse(values)
      const user = await registerUser({ name: parsed.name, email: parsed.email, password: parsed.password })
      showToast(`Account created for ${user.name}.`)
      navigate(safeRedirect(searchParams.get('redirect'), '/'), { replace: true })
    } catch (error) {
      if (error instanceof z.ZodError) {
        applyZodErrors(error, setError)
        return
      }
      setSubmitError(errorMessage(error))
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Register to shop, save your cart and track orders.</p>

      {submitError && <Alert variant="error" title="Unable to register" className="mt-5">{submitError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} helperText="At least 8 characters." {...register('password')} />
        <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>Create account</Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account? <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Log in</Link>
      </p>
      <p className="mt-3 text-center text-xs text-slate-400">Admin accounts are provisioned by the store owner.</p>
    </div>
  )
}
