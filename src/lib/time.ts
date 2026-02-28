import type { FocusSession } from '../types/session'

const dateHeadingFormatter = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const formatClock = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const formatDurationShort = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, totalSeconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)

  if (hours === 0) {
    return `${minutes}m`
  }

  return `${hours}h ${minutes}m`
}

export const formatTime = (iso: string): string => timeFormatter.format(new Date(iso))

export const formatTimeRange = (startIso: string, endIso: string | null): string => {
  const start = formatTime(startIso)
  if (!endIso) {
    return `${start} - ...`
  }
  return `${start} - ${formatTime(endIso)}`
}

export const getLocalDateKey = (iso: string): string => {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatDateHeading = (iso: string): string => dateHeadingFormatter.format(new Date(iso))

export const sessionFocusDurationSec = (session: FocusSession): number =>
  session.focusedSec + session.overtimeSec
