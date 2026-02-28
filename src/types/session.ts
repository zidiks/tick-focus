export type PresetMinutes = 15 | 25 | 45 | 60

export type ActiveSessionStatus = 'running' | 'paused' | 'awaiting_decision' | 'overtime'

export type SessionStatus = ActiveSessionStatus | 'completed' | 'interrupted'

export interface FocusSession {
  id: string
  plannedMinutes: PresetMinutes
  startedAt: string
  endedAt: string | null
  status: SessionStatus
  remainingSec: number
  focusedSec: number
  decisionWaitSec: number
  overtimeSec: number
  lastTickAt: string
  pausedAt: string | null
  note?: string | null
}

export interface PersistedStateV1 {
  sessions: FocusSession[]
  activeSessionId: string | null
  selectedPreset: PresetMinutes
}

export const STORAGE_KEY = 'tick-focus:v1'
export const PRESET_OPTIONS: PresetMinutes[] = [15, 25, 45, 60]

export const DEFAULT_STATE: PersistedStateV1 = {
  sessions: [],
  activeSessionId: null,
  selectedPreset: 25,
}

export const isActiveStatus = (status: SessionStatus): status is ActiveSessionStatus =>
  status === 'running' ||
  status === 'paused' ||
  status === 'awaiting_decision' ||
  status === 'overtime'
