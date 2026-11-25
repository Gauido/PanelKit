import { Loader2, LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Button } from '../ui/button'

export type LoginScreenProps = {
  name: string
  /** Throws with a message to show when the email or password are wrong. */
  onLogin: (email: string, password: string) => Promise<unknown>
  /** Optional help under the form, e.g. demo users. */
  hint?: string
}

/** Full-page sign in with email and password. */
export function LoginScreen({ name, onLogin, hint }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onLogin(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message.replace(/^\d{3}\s*/, '') : String(err))
    } finally {
      setBusy(false)
    }
  }
  const input = 'h-10 w-full rounded-[calc(var(--radius)-4px)] border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'
  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 p-4 text-foreground">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-[var(--radius)] border border-border bg-card p-7 shadow-xl"
      >
        <span className="grid size-11 place-items-center rounded-[calc(var(--radius)-2px)] bg-primary text-primary-foreground shadow-sm">
          <LockKeyhole className="size-5" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">Ingresá a {name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Usá tu email y tu contraseña.</p>
        <label className="mt-6 grid gap-1.5 text-sm font-medium">
          Email
          <input className={input} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mt-4 grid gap-1.5 text-sm font-medium">
          Contraseña
          <input className={input} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && (
          <p role="alert" className="mt-4 rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}
        <Button type="submit" className="mt-6 w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />} Ingresar
        </Button>
        {hint && <p className="mt-4 text-center text-xs text-muted-foreground">{hint}</p>}
      </motion.form>
    </div>
  )
}
