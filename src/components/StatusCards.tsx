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
    <section aria-label="Estados del sistema">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Estado del sistema
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statuses.map((s) => (
          <article
            key={s.id}
            className={
              s.active
                ? 'rounded-lg border border-teal-300 bg-teal-50 px-4 py-3 shadow-sm'
                : 'rounded-lg border border-slate-200 bg-white/60 px-4 py-3 opacity-55'
            }
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900">{s.label}</h3>
              <span
                className={
                  s.active
                    ? 'rounded bg-teal-600 px-2 py-0.5 text-xs font-medium text-white'
                    : 'rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600'
                }
              >
                {s.active ? 'ACTIVO' : 'off'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{s.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
