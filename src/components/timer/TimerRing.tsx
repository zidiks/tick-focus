interface TimerRingProps {
  display: string
  progress: number
}

const ringSize = 360
const radius = 142
const circumference = 2 * Math.PI * radius

export const TimerRing = ({ display, progress }: TimerRingProps) => {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const dashOffset = circumference * (1 - clampedProgress)

  return (
    <div className="relative flex h-[360px] w-[360px] items-center justify-center">
      <svg viewBox={`0 0 ${ringSize} ${ringSize}`} className="absolute inset-0">
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke="#e8ebf3"
          strokeWidth="11"
          strokeDasharray="1 6"
          strokeLinecap="round"
        />
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke="#4c6fff"
          strokeWidth="10"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
          className="transition-[stroke-dashoffset] duration-700 ease-linear"
        />
      </svg>
      <span className="font-['Sora'] text-[70px] leading-none tracking-tight text-slate-900">{display}</span>
    </div>
  )
}
