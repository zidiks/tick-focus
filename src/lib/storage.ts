import {
  DEFAULT_STATE,
  PRESET_OPTIONS,
  STORAGE_KEY,
  type FocusSession,
  type PersistedStateV1,
  type PresetMinutes,
  type SessionStatus,
} from '../types/session'

const validStatuses: SessionStatus[] = [
  'running',
  'paused',
  'awaiting_decision',
  'overtime',
  'completed',
  'interrupted',
]

const isPreset = (value: unknown): value is PresetMinutes =>
  typeof value === 'number' && PRESET_OPTIONS.includes(value as PresetMinutes)

const isStatus = (value: unknown): value is SessionStatus =>
  typeof value === 'string' && validStatuses.includes(value as SessionStatus)

const sanitizeSession = (raw: unknown): FocusSession | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const data = raw as Record<string, unknown>
  if (
    typeof data.id !== 'string' ||
    !isPreset(data.plannedMinutes) ||
    typeof data.startedAt !== 'string' ||
    !isStatus(data.status) ||
    typeof data.remainingSec !== 'number' ||
    typeof data.focusedSec !== 'number' ||
    typeof data.decisionWaitSec !== 'number' ||
    typeof data.overtimeSec !== 'number' ||
    typeof data.lastTickAt !== 'string'
  ) {
    return null
  }

  const endedAt = data.endedAt === null || typeof data.endedAt === 'string' ? data.endedAt : null
  const pausedAt = data.pausedAt === null || typeof data.pausedAt === 'string' ? data.pausedAt : null
  const note = data.note === undefined || data.note === null || typeof data.note === 'string' ? data.note : null

  return {
    id: data.id,
    plannedMinutes: data.plannedMinutes,
    startedAt: data.startedAt,
    endedAt,
    status: data.status,
    remainingSec: Math.max(0, Math.floor(data.remainingSec)),
    focusedSec: Math.max(0, Math.floor(data.focusedSec)),
    decisionWaitSec: Math.max(0, Math.floor(data.decisionWaitSec)),
    overtimeSec: Math.max(0, Math.floor(data.overtimeSec)),
    lastTickAt: data.lastTickAt,
    pausedAt,
    note,
  }
}

const sanitizePersistedState = (raw: unknown): PersistedStateV1 => {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_STATE }
  }

  const data = raw as Record<string, unknown>
  const sessions = Array.isArray(data.sessions)
    ? data.sessions.map(sanitizeSession).filter((session): session is FocusSession => session !== null)
    : []

  const selectedPreset = isPreset(data.selectedPreset) ? data.selectedPreset : DEFAULT_STATE.selectedPreset
  const activeSessionId =
    typeof data.activeSessionId === 'string' && sessions.some((session) => session.id === data.activeSessionId)
      ? data.activeSessionId
      : null

  return {
    sessions,
    activeSessionId,
    selectedPreset,
  }
}

export const loadState = (): PersistedStateV1 => {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_STATE }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULT_STATE }
    }

    return sanitizePersistedState(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export const saveState = (state: PersistedStateV1): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
