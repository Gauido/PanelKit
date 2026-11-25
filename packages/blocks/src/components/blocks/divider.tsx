export type DividerProps = { label?: string; spacing?: number }

/** A line between blocks, optionally with a label in the middle. */
export function Divider({ label, spacing = 8 }: DividerProps) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground" style={{ paddingBlock: spacing }} role="separator">
      <span className="h-px flex-1 bg-border" />
      {label && (
        <>
          <span>{label}</span>
          <span className="h-px flex-1 bg-border" />
        </>
      )}
    </div>
  )
}

export type SpacerProps = { size?: number }

/** Empty space, in px. */
export function Spacer({ size = 24 }: SpacerProps) {
  return <div aria-hidden style={{ height: size }} />
}
