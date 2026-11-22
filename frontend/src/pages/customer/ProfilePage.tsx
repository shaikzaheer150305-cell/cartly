import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, Badge, Button, Input } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { applyZodErrors } from '../../lib/form'
import { api, errorMessage } from '../../services/api'

const schema = z.object({
  name: z.string().min(2, 'Enter your full name.'),
  email: z.string().email(),
})

type ProfileValues = z.infer<typeof schema>

export function ProfilePage() {
  const { user, setUser } = useAuth()
  const { showToast } = useToast()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setError, formState: { errors } } = useForm<ProfileValues>({
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  const onSubmit = async (values: ProfileValues) => {
    if (!user) return
    setSubmitError(null)
    setSaving(true)
    try {
      const parsed = schema.parse(values)
      const updated = await api.updateProfile(parsed.name)
      setUser(updated)
      showToast('Profile updated.')
    } catch (error) {
      if (error instanceof z.ZodError) applyZodErrors(error, setError)
      else setSubmitError(errorMessage(error))
      showToast('Profile could not be saved.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
      <p className="mb-6 text-sm text-slate-500">Manage the details shown on your account.</p>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Account role</p>
            <p className="mt-1 text-xs text-slate-500">Roles are assigned by the store owner and cannot be changed here.</p>
          </div>
          {user && <Badge variant={user.role === 'ADMIN' ? 'indigo' : 'sky'}>{user.role}</Badge>}
        </div>

        {submitError && <Alert variant="error" title="Profile could not be saved" className="mt-5">{submitError}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <Input label="Full name" error={errors.name?.message} {...register('name')} />
          <Input label="Email" readOnly disabled helperText="Email cannot be changed in this demo." {...register('email')} />
          <Input label="Password" type="password" value="••••••••" disabled helperText="Password changes are deferred in the MVP." readOnly />
          <Button type="submit" isLoading={saving}>Save profile</Button>
        </form>
      </div>
    </div>
  )
}
