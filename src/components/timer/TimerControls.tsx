type TimerMode = 'idle' | 'running' | 'paused' | 'awaiting_decision' | 'overtime'

interface TimerControlsProps {
  mode: TimerMode
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onContinue: () => void
  onFinish: () => void
}

const primaryButtonClass =
  'inline-flex min-w-[168px] items-center justify-center rounded-full bg-blue-500 px-8 py-3 text-base font-semibold text-white shadow-[0_10px_24px_-16px_rgba(37,99,235,0.85)] transition hover:bg-blue-600'

const secondaryButtonClass =
  'inline-flex min-w-[140px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50'

export const TimerControls = ({
  mode,
  onStart,
  onPause,
  onResume,
  onContinue,
  onFinish,
}: TimerControlsProps) => {
  if (mode === 'idle') {
    return (
      <button type="button" onClick={onStart} className={primaryButtonClass}>
        Start
      </button>
    )
  }

  if (mode === 'awaiting_decision') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={onContinue} className={primaryButtonClass}>
          Continue
        </button>
        <button type="button" onClick={onFinish} className={secondaryButtonClass}>
          Finish
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={mode === 'paused' ? onResume : onPause}
        className={primaryButtonClass}
      >
        {mode === 'paused' ? 'Resume' : 'Pause'}
      </button>
      <button type="button" onClick={onFinish} className={secondaryButtonClass}>
        Finish
      </button>
    </div>
  )
}
