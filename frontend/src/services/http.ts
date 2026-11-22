export class ApiError extends Error {
  status: number
  code: string
  details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export interface SessionResponse<TUser = unknown> {
  accessToken: string
  user: TUser
}

const configuredBaseUrl = import.meta.env.VITE_API_URL as string | undefined
const API_BASE_URL = (configuredBaseUrl || 'http://localhost:4000/api').replace(/\/$/, '')
const NO_REFRESH_PATHS = ['/auth/login', '/auth/admin/login', '/auth/register', '/auth/refresh', '/auth/logout']

let accessToken: string | null = null

export function getToken(): string | null {
  return accessToken
}

export function setToken(token: string): void {
  accessToken = token
}

export function clearToken(): void {
  accessToken = null
}

async function readPayload(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function toApiError(response: Response, payload: unknown): ApiError {
  const body = payload as { code?: unknown; message?: unknown; details?: unknown } | null
  const code = typeof body?.code === 'string' ? body.code : 'REQUEST_FAILED'
  const message = typeof body?.message === 'string' ? body.message : 'The request could not be completed.'
  const details = body?.details && typeof body.details === 'object'
    ? body.details as Record<string, unknown>
    : undefined
  return new ApiError(response.status, code, message, details)
}

export async function refreshSession(): Promise<SessionResponse | null> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) {
    accessToken = null
    return null
  }
  const payload = await readPayload(response) as SessionResponse
  if (!payload || typeof payload.accessToken !== 'string') {
    accessToken = null
    return null
  }
  accessToken = payload.accessToken
  return payload
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export async function request<T>(path: string, options: RequestOptions = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getToken()

  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const payload = await readPayload(response)

  if (!response.ok) {
    const error = toApiError(response, payload)
    if (response.status === 401 && retry && !NO_REFRESH_PATHS.some((entry) => path.startsWith(entry))) {
      const session = await refreshSession()
      if (session) return request<T>(path, options, false)
    }
    if (response.status === 401) clearToken()
    throw error
  }

  return payload as T
}
