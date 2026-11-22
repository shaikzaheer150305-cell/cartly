function requiredSecret(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function jwtAccessSecret(): string {
  return requiredSecret('JWT_ACCESS_SECRET')
}

export function refreshTokenSecret(): string {
  return requiredSecret('JWT_REFRESH_SECRET')
}

export function webOrigin(): string {
  return process.env.WEB_ORIGIN ?? 'http://localhost:5173'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function trustProxy(): number {
  const raw = process.env.TRUST_PROXY
  if (raw === undefined || raw.trim() === '') return isProduction() ? 1 : 0
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0 || value > 2) return isProduction() ? 1 : 0
  return value
}

function required(name: string, issues: string[]): string | undefined {
  const value = process.env[name]?.trim()
  if (!value) issues.push(`${name} is required`)
  return value
}

function validateSecret(name: string, issues: string[]): void {
  const value = required(name, issues)
  if (value && value.length < 32) issues.push(`${name} must be a unique long random value`)
}

export function validateProductionEnv(): void {
  if (!isProduction()) return

  const issues: string[] = []
  required('DATABASE_URL', issues)
  required('DIRECT_URL', issues)
  validateSecret('JWT_ACCESS_SECRET', issues)
  validateSecret('JWT_REFRESH_SECRET', issues)

  const access = process.env.JWT_ACCESS_SECRET?.trim() ?? ''
  const refresh = process.env.JWT_REFRESH_SECRET?.trim() ?? ''
  if (access && refresh && access === refresh) issues.push('JWT secrets must be different')

  const origin = required('WEB_ORIGIN', issues)
  if (origin) {
    try {
      const url = new URL(origin)
      if (url.protocol !== 'https:') issues.push('WEB_ORIGIN must use HTTPS')
      if (url.username || url.password) issues.push('WEB_ORIGIN must not contain credentials')
    } catch {
      issues.push('WEB_ORIGIN must be a valid URL')
    }
  }

  const port = Number(process.env.PORT ?? '4000')
  if (!Number.isInteger(port) || port < 1 || port > 65535) issues.push('PORT must be between 1 and 65535')

  if (issues.length > 0) {
    throw new Error(`Invalid production configuration: ${issues.join('; ')}`)
  }
}
