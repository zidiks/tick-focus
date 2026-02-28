import { formatDateHeading, formatDurationShort, formatTimeRange, getLocalDateKey, sessionFocusDurationSec } from '../../lib/time'
import { isActiveStatus, type FocusSession } from '../../types/session'

interface FocusRecordListProps {
  sessions: FocusSession[]
  activeSessionId: string | null
}

interface GroupedSessions {
  dateKey: string
  heading: string
  entries: FocusSession[]
}

const statusLabelMap = {
  completed: 'Completed',
  interrupted: 'Interrupted',
  running: 'Active',
  paused: 'Paused',
  awaiting_decision: 'Time up',
  overtime: 'Overtime',
} as const

const statusClassMap = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  interrupted: 'bg-amber-50 text-amber-700 border-amber-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
  paused: 'bg-slate-100 text-slate-700 border-slate-200',
  awaiting_decision: 'bg-rose-50 text-rose-700 border-rose-200',
  overtime: 'bg-indigo-50 text-indigo-700 border-indigo-200',
} as const

const groupSessionsByDay = (sessions: FocusSession[]): GroupedSessions[] => {
  const sorted = [...sessions].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
  const map = new Map<string, GroupedSessions>()

  for (const session of sorted) {
    const key = getLocalDateKey(session.startedAt)
    if (!map.has(key)) {
      map.set(key, { dateKey: key, heading: formatDateHeading(session.startedAt), entries: [] })
    }

    map.get(key)!.entries.push(session)
  }

  return [...map.values()].sort((a, b) => b.dateKey.localeCompare(a.dateKey))
}

export const FocusRecordList = ({ sessions, activeSessionId }: FocusRecordListProps) => {
  const groups = groupSessionsByDay(sessions)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[2rem] font-semibold tracking-tight text-slate-900">Focus Record</h2>
        <span className="text-3xl font-light text-slate-400">+</span>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center text-sm text-slate-500">
          No sessions yet. Start your first focus block.
        </div>
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <div key={group.dateKey} className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-500">{group.heading}</h3>
              <ul className="space-y-3">
                {group.entries.map((session) => {
                  const isCurrent = activeSessionId === session.id && isActiveStatus(session.status)
                  const duration = formatDurationShort(sessionFocusDurationSec(session))
                  const label = statusLabelMap[session.status]

                  return (
                    <li
                      key={session.id}
                      className={`rounded-xl border bg-white/85 px-3 py-3 ${
                        isCurrent ? 'border-blue-200 shadow-sm' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                isCurrent ? 'bg-blue-500' : 'bg-slate-300'
                              }`}
                            />
                            <p className="truncate text-sm font-medium text-slate-700">
                              {formatTimeRange(session.startedAt, session.endedAt)}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            Planned {session.plannedMinutes}m
                            {session.status === 'awaiting_decision'
                              ? ` • waiting ${formatDurationShort(session.decisionWaitSec)}`
                              : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClassMap[session.status]}`}
                          >
                            {label}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">{duration}</span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
