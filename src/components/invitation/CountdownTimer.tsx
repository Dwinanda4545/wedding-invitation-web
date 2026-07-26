import { useEffect, useState } from 'react'

type Props = {
  targetDate?: string | null
}

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calcTimeLeft(targetDate?: string | null): TimeLeft | null {
  if (!targetDate) return null
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export function CountdownTimer({ targetDate }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calcTimeLeft(targetDate),
  )

  useEffect(() => {
    setTimeLeft(calcTimeLeft(targetDate))
    const id = window.setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate))
    }, 1000)
    return () => window.clearInterval(id)
  }, [targetDate])

  if (!timeLeft) return null

  const items = [
    { value: timeLeft.days, label: 'Hari' },
    { value: timeLeft.hours, label: 'Jam' },
    { value: timeLeft.minutes, label: 'Menit' },
    { value: timeLeft.seconds, label: 'Detik' },
  ]

  return (
    <div className="inv-countdown-grid inv-animate-fade-up">
      {items.map((item) => (
        <div key={item.label} className="inv-countdown-item">
          <div className="inv-countdown-value">
            {String(item.value).padStart(2, '0')}
          </div>
          <div className="inv-countdown-label">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
