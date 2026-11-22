import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ZodError } from 'zod'

export function applyZodErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): void {
  if (!(error instanceof ZodError)) return
  error.issues.forEach((issue) => {
    const field = issue.path[0]
    if (typeof field === 'string') {
      setError(field as Path<T>, { type: 'validate', message: issue.message })
    }
  })
}
