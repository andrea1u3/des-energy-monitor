import type { DerivedStatus } from '../types/energy'

interface Props {
  statuses: DerivedStatus[]
}

/**
 * Tarjetas de estado del sistema energético.
 * Solo las activas destacan; las inactivas quedan atenuadas.
 */
export function StatusCards({ statuses }: Props) {
  return (
    <section aria-label="Estados del sistema" data-testid="status-cards">
      <div className="mb-4">
        <h2 className="section-label">Site state machine</h2>
        <p className="mt-1 font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]">
          Estado del sistema
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statuses.map((s) => (
          <article
            key={s.id}
            data-testid={`status-card-${s.id}`}
            data-active={s.active ? 'true' : 'false'}
            className={`panel px-4 py-3.5 transition-[opacity,border-color,background-color] duration-300 ${
              s.active
                ? 'border-[color-mix(in_srgb,var(--color-battery)_45%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-battery)_8%,white)]'
                : 'opacity-50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">{s.label}</h3>
              <span
                className={`font-mono text-[10px] font-medium uppercase tracking-wider ${
                  s.active
                    ? 'text-[var(--color-battery)]'
                    : 'text-[var(--color-ink-muted)]'
                }`}
              >
                {s.active ? 'ACTIVE' : 'idle'}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-snug text-[var(--color-ink-muted)]">
              {s.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
