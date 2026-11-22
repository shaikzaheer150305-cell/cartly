import { formatDate } from '../../lib/utils'
import type { OrderEvent } from '../../types'
import { StatusBadge } from '../ui'

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No status updates yet.</p>
  }

  return (
    <ol className="space-y-4">
      {[...events].reverse().map((event, index) => (
        <li key={event.id} className="relative flex gap-3 pl-1">
          {index < events.length - 1 && <span className="absolute left-[9px] top-5 h-full w-px bg-slate-200" />}
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={event.status} />
              <span className="text-xs text-slate-500">{event.actorType}</span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{event.note}</p>
            <p className="mt-0.5 text-xs text-slate-400">{formatDate(event.timestamp)}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
