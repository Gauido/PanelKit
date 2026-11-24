import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'

export type ActionButtonProps = {
  label: string
  variant?: 'primary' | 'outline' | 'ghost'
  fullWidth?: boolean
  onClick?: () => Promise<unknown> | void
}

export function ActionButton({ label, variant = 'primary', fullWidth, onClick }: ActionButtonProps) {
  const [busy, setBusy] = useState(false)
  return (
    <Button
      variant={variant}
      className={fullWidth ? 'w-full' : undefined}
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await onClick?.()
        } finally {
          setBusy(false)
        }
      }}
    >
      {busy && <Loader2 className="size-4 animate-spin" />}
      {label}
    </Button>
  )
}
