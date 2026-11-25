import { useSyncExternalStore } from 'react'
import type { Api } from './api'
import { getPath } from './utils'

/** Who is signed in. The token goes in every API call; the user is readable as {{user.x}}. */
export type Session = { token?: string; user: Record<string, unknown> }

export type AuthConfig = {
  loginPath: string
  emailField: string
  passwordField: string
  tokenPath: string
  userPath: string
  roleField: string
}

let key = 'panelkit:session'
const listeners = new Set<() => void>()
let cache: { raw: string | null; value: Session | null } = { raw: null, value: null }

function read(): Session | null {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(key)
  } catch {
    /* storage may be unavailable */
  }
  if (raw === cache.raw) return cache.value
  let value: Session | null = null
  try {
    value = raw ? (JSON.parse(raw) as Session) : null
  } catch {
    value = null
  }
  cache = { raw, value }
  return value
}

function write(s: Session | null) {
  try {
    if (s) localStorage.setItem(key, JSON.stringify(s))
    else localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

/** Keeps sessions of different apps apart (same browser, same origin). */
export function setSessionKey(name: string) {
  key = `panelkit:session:${name}`
}

export const getSession = read
export const setSession = (s: Session) => write(s)
export const logout = () => write(null)

export function useSession(): Session | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      const onStorage = (e: StorageEvent) => e.key === key && cb()
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(cb)
        window.removeEventListener('storage', onStorage)
      }
    },
    read,
    () => null,
  )
}

/** Calls the login endpoint and keeps the session. Throws with a readable message when it fails. */
export async function login(api: Api, cfg: AuthConfig, email: string, password: string): Promise<Session> {
  let res: unknown
  try {
    res = await api.request('POST', cfg.loginPath, { [cfg.emailField]: email, [cfg.passwordField]: password })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(/40[13]/.test(msg) || /incorrect/i.test(msg) ? 'Email o contraseña incorrectos' : msg)
  }
  const token = getPath(res, cfg.tokenPath)
  const user = (cfg.userPath ? getPath(res, cfg.userPath) : res) ?? { email }
  const session: Session = { token: token == null ? undefined : String(token), user: user as Record<string, unknown> }
  setSession(session)
  return session
}

/** True when the role list is empty or includes the user's role (one role, or a list of them). */
export function hasRole(session: Session | null, roles: string[] | undefined, roleField = 'role'): boolean {
  if (!roles?.length) return true
  const r = session ? getPath(session.user, roleField) : undefined
  const mine = Array.isArray(r) ? r.map(String) : r == null ? [] : [String(r)]
  return mine.some((x) => roles.includes(x))
}
