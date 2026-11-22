import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { ErrorMessage } from './ErrorMessage'

const fieldBase = 'w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-slate-50'

function fieldClasses(error?: string, extra?: string): string {
  return cn(
    fieldBase,
    'h-11',
    error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500',
    extra,
  )
}

interface FieldFrameProps {
  id: string
  label?: string
  error?: string
  helperText?: string
  children: ReactNode
}

function FieldFrame({ id, label, error, helperText, children }: FieldFrameProps) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>}
      {children}
      {error ? (
        <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage>
      ) : helperText ? (
        <p id={`${id}-help`} className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Input({ label, error, helperText, className, id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <FieldFrame id={inputId} label={label} error={error} helperText={helperText}>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
        className={fieldClasses(error, className)}
        {...props}
      />
    </FieldFrame>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Textarea({ label, error, helperText, className, id, rows = 4, ...props }: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldFrame id={fieldId} label={label} error={error} helperText={helperText}>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : helperText ? `${fieldId}-help` : undefined}
        className={fieldClasses(error, cn('h-auto min-h-24 py-2', className))}
        {...props}
      />
    </FieldFrame>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Select({ label, error, helperText, className, id, children, ...props }: SelectProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldFrame id={fieldId} label={label} error={error} helperText={helperText}>
      <select
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : helperText ? `${fieldId}-help` : undefined}
        className={fieldClasses(error, className)}
        {...props}
      >
        {children}
      </select>
    </FieldFrame>
  )
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export function Checkbox({ label, error, className, id, ...props }: CheckboxProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          id={fieldId}
          type="checkbox"
          aria-invalid={Boolean(error)}
          className={cn('h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500', className)}
          {...props}
        />
        <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">{label}</label>
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}
