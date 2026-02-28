import { useEffect, useMemo, useState } from 'react'
import { formatClock } from '../lib/time'
import { loadState, saveState } from '../lib/storage'
import { clamp } from '../lib/time'
import {
  DEFAULT_STATE,
  isActiveStatus,
  type FocusSession,
  type PersistedStateV1,
  type PresetMinutes,
} from '../types/session'

type TimerMode = 'idle' | 'running' | 'paused' | 'awaiting_decision' | 'overtime'

interface UsePomodoroResult {
  state: PersistedStateV1
  activeSession: FocusSession | null
  mode: TimerMode
  timerDisplay: string
  progress: number
  statusCaption: string
  setPreset: (preset: PresetMinutes) => void
  start: (preset: PresetMinutes) => void
  pause: () => void
  resume: () => void
  continueAfterTimeout: () => void
  finish: () => void
}

const activeTickStatuses = new Set<FocusSession['status']>(['running', 'awaiting_decision', 'overtime'])

const createSessionId = (): string =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const getActiveIndex = (state: PersistedStateV1): number =>
  state.activeSessionId ? state.sessions.findIndex((session) => session.id === state.activeSessionId) : -1

const reconcileSession = (session: FocusSession, nowMs: number): FocusSession => {
  if (!isActiveStatus(session.status) || session.status === 'paused') {
    return session
  }

  const lastTickMs = Date.parse(session.lastTickAt)
  if (!Number.isFinite(lastTickMs)) {
    return {
      ...session,
      lastTickAt: new Date(nowMs).toISOString(),
    }
  }

  const deltaSec = Math.floor((nowMs - lastTickMs) / 1000)
  if (deltaSec <= 0) {
    return session
  }

  const nowIso = new Date(nowMs).toISOString()
  if (session.status === 'running') {
    const countdownSpent = Math.min(session.remainingSec, deltaSec)
    const overflow = deltaSec - countdownSpent
    const remainingSec = Math.max(0, session.remainingSec - countdownSpent)

    return {
      ...session,
      status: remainingSec === 0 ? 'awaiting_decision' : 'running',
      remainingSec,
      focusedSec: session.focusedSec + countdownSpent,
      decisionWaitSec: session.decisionWaitSec + overflow,
      lastTickAt: nowIso,
    }
  }

  if (session.status === 'awaiting_decision') {
    return {
      ...session,
      decisionWaitSec: session.decisionWaitSec + deltaSec,
      lastTickAt: nowIso,
    }
  }

  return {
    ...session,
    overtimeSec: session.overtimeSec + deltaSec,
    lastTickAt: nowIso,
  }
}

const reconcileStateAt = (state: PersistedStateV1, now: Date): PersistedStateV1 => {
  const activeIndex = getActiveIndex(state)
  if (activeIndex < 0) {
    if (state.activeSessionId !== null) {
      return { ...state, activeSessionId: null }
    }
    return state
  }

  const active = state.sessions[activeIndex]
  if (!isActiveStatus(active.status)) {
    return { ...state, activeSessionId: null }
  }

  const updated = reconcileSession(active, now.getTime())
  if (updated === active) {
    return state
  }

  const sessions = [...state.sessions]
  sessions[activeIndex] = updated

  return {
    ...state,
    sessions,
    activeSessionId: isActiveStatus(updated.status) ? updated.id : null,
  }
}

const closeActiveSession = (
  state: PersistedStateV1,
  closeStatus: 'completed' | 'interrupted',
  now: Date,
): PersistedStateV1 => {
  const reconciled = reconcileStateAt(state, now)
  const activeIndex = getActiveIndex(reconciled)
  if (activeIndex < 0) {
    return reconciled
  }

  const active = reconciled.sessions[activeIndex]
  if (!isActiveStatus(active.status)) {
    return {
      ...reconciled,
      activeSessionId: null,
    }
  }

  const nowIso = now.toISOString()
  const sessions = [...reconciled.sessions]
  sessions[activeIndex] = {
    ...active,
    status: closeStatus,
    endedAt: nowIso,
    pausedAt: null,
    lastTickAt: nowIso,
  }

  return {
    ...reconciled,
    sessions,
    activeSessionId: null,
  }
}

const getMode = (activeSession: FocusSession | null): TimerMode => {
  if (!activeSession) {
    return 'idle'
  }
  if (
    activeSession.status === 'completed' ||
    activeSession.status === 'interrupted'
  ) {
    return 'idle'
  }
  return activeSession.status
}

export const usePomodoro = (): UsePomodoroResult => {
  const [state, setState] = useState<PersistedStateV1>(() =>
    reconcileStateAt(loadState() ?? DEFAULT_STATE, new Date()),
  )

  const activeSession = useMemo(() => {
    if (!state.activeSessionId) {
      return null
    }
    return state.sessions.find((session) => session.id === state.activeSessionId) ?? null
  }, [state.activeSessionId, state.sessions])

  const activeSessionId = activeSession?.id ?? null
  const activeSessionStatus = activeSession?.status ?? null
  const shouldTick = activeSessionStatus ? activeTickStatuses.has(activeSessionStatus) : false

  const mode = getMode(activeSession)

  const timerDisplay = useMemo(() => {
    if (!activeSession) {
      return formatClock(state.selectedPreset * 60)
    }

    if (activeSession.status === 'awaiting_decision') {
      return '00:00'
    }

    if (activeSession.status === 'overtime') {
      return `+${formatClock(activeSession.overtimeSec)}`
    }

    return formatClock(activeSession.remainingSec)
  }, [activeSession, state.selectedPreset])

  const progress = useMemo(() => {
    if (!activeSession) {
      return 0
    }
    const fullDurationSec = activeSession.plannedMinutes * 60
    if (fullDurationSec <= 0) {
      return 0
    }
    if (activeSession.remainingSec <= 0) {
      return 1
    }
    return clamp((fullDurationSec - activeSession.remainingSec) / fullDurationSec, 0, 1)
  }, [activeSession])

  const statusCaption = useMemo(() => {
    if (!activeSession) {
      return 'Focus'
    }

    if (activeSession.status === 'awaiting_decision') {
      return `Time is up • waiting ${formatClock(activeSession.decisionWaitSec)}`
    }

    if (activeSession.status === 'overtime') {
      return `Overtime • ${formatClock(activeSession.overtimeSec)}`
    }

    if (activeSession.status === 'paused') {
      return 'Paused'
    }

    return 'Focusing'
  }, [activeSession])

  const setPreset = (preset: PresetMinutes) => {
    setState((prev) => ({ ...prev, selectedPreset: preset }))
  }

  const start = (preset: PresetMinutes) => {
    setState((prev) => {
      const now = new Date()
      const interrupted = closeActiveSession(prev, 'interrupted', now)
      const nowIso = now.toISOString()
      const newSession: FocusSession = {
        id: createSessionId(),
        plannedMinutes: preset,
        startedAt: nowIso,
        endedAt: null,
        status: 'running',
        remainingSec: preset * 60,
        focusedSec: 0,
        decisionWaitSec: 0,
        overtimeSec: 0,
        lastTickAt: nowIso,
        pausedAt: null,
      }

      return {
        ...interrupted,
        selectedPreset: preset,
        sessions: [...interrupted.sessions, newSession],
        activeSessionId: newSession.id,
      }
    })
  }

  const pause = () => {
    setState((prev) => {
      const now = new Date()
      const reconciled = reconcileStateAt(prev, now)
      const activeIndex = getActiveIndex(reconciled)
      if (activeIndex < 0) {
        return reconciled
      }

      const active = reconciled.sessions[activeIndex]
      if (active.status !== 'running' && active.status !== 'overtime') {
        return reconciled
      }

      const nowIso = now.toISOString()
      const sessions = [...reconciled.sessions]
      sessions[activeIndex] = {
        ...active,
        status: 'paused',
        pausedAt: nowIso,
        lastTickAt: nowIso,
      }

      return {
        ...reconciled,
        sessions,
      }
    })
  }

  const resume = () => {
    setState((prev) => {
      const activeIndex = getActiveIndex(prev)
      if (activeIndex < 0) {
        return prev
      }

      const active = prev.sessions[activeIndex]
      if (active.status !== 'paused') {
        return prev
      }

      const nowIso = new Date().toISOString()
      const sessions = [...prev.sessions]
      sessions[activeIndex] = {
        ...active,
        status: active.remainingSec > 0 ? 'running' : 'overtime',
        pausedAt: null,
        lastTickAt: nowIso,
      }

      return {
        ...prev,
        sessions,
      }
    })
  }

  const continueAfterTimeout = () => {
    setState((prev) => {
      const now = new Date()
      const reconciled = reconcileStateAt(prev, now)
      const activeIndex = getActiveIndex(reconciled)
      if (activeIndex < 0) {
        return reconciled
      }

      const active = reconciled.sessions[activeIndex]
      if (active.status !== 'awaiting_decision') {
        return reconciled
      }

      const nowIso = now.toISOString()
      const sessions = [...reconciled.sessions]
      sessions[activeIndex] = {
        ...active,
        status: 'overtime',
        lastTickAt: nowIso,
      }

      return {
        ...reconciled,
        sessions,
      }
    })
  }

  const finish = () => {
    setState((prev) => closeActiveSession(prev, 'completed', new Date()))
  }

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    if (!shouldTick) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setState((prev) => reconcileStateAt(prev, new Date()))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [activeSessionId, shouldTick])

  return {
    state,
    activeSession,
    mode,
    timerDisplay,
    progress,
    statusCaption,
    setPreset,
    start,
    pause,
    resume,
    continueAfterTimeout,
    finish,
  }
}
