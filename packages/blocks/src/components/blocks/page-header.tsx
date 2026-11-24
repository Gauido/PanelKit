export type PageHeaderProps = { title: string; subtitle?: string }

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="py-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
