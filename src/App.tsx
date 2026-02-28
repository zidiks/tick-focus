import { AppLayout } from './components/layout/AppLayout'
import { OverviewCards } from './components/sidebar/OverviewCards'
import { FocusRecordList } from './components/sidebar/FocusRecordList'
import { TimerControls } from './components/timer/TimerControls'
import { TimerRing } from './components/timer/TimerRing'
import { usePomodoro } from './hooks/usePomodoro'
import { formatDurationShort, getLocalDateKey, sessionFocusDurationSec } from './lib/time'
import { PRESET_OPTIONS } from './types/session'

function App() {
  const {
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
  } = usePomodoro()

  const nowKey = getLocalDateKey(new Date().toISOString())
  const finishedSessions = state.sessions.filter((session) => session.endedAt !== null)
  const todaySessions = finishedSessions.filter((session) => getLocalDateKey(session.startedAt) === nowKey)

  const todayFocusSec = todaySessions.reduce(
    (sum, session) => sum + sessionFocusDurationSec(session),
    0,
  )
  const totalFocusSec = finishedSessions.reduce(
    (sum, session) => sum + sessionFocusDurationSec(session),
    0,
  )

  return (
    <AppLayout
      left={
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          <header className="flex items-center justify-between">
            <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Pomodoro</h1>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 p-1 backdrop-blur">
              {PRESET_OPTIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPreset(preset)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    preset === state.selectedPreset
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </header>

          <div className="mt-16 flex flex-1 flex-col items-center justify-center gap-10">
            <p className="text-sm font-medium text-slate-500">
              {statusCaption ? statusCaption : 'Focus'}
            </p>
            <TimerRing display={timerDisplay} progress={progress} />
            <TimerControls
              mode={mode}
              onStart={() => start(state.selectedPreset)}
              onPause={pause}
              onResume={resume}
              onContinue={continueAfterTimeout}
              onFinish={finish}
            />
          </div>
        </div>
      }
      right={
        <div className="space-y-9">
          <OverviewCards
            todayPomos={todaySessions.length}
            todayFocusDuration={formatDurationShort(todayFocusSec)}
            totalPomos={finishedSessions.length}
            totalFocusDuration={formatDurationShort(totalFocusSec)}
          />
          <FocusRecordList sessions={state.sessions} activeSessionId={activeSession?.id ?? null} />
        </div>
      }
    />
  )
}

export default App
