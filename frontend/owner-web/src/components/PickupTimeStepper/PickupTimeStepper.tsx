import { Icon } from '../Icon'
import { COOKING_TIME_MAX, COOKING_TIME_MIN, COOKING_TIME_STEP, clampCookingMinutes, formatPickupMinutes } from '../../lib/ownerPickupTime'
import styles from './PickupTimeStepper.module.css'

type PickupTimeStepperProps = {
  label: string
  minutes: number
  onChange: (minutes: number) => void
  step?: number
  min?: number
  max?: number
  hint?: string
  compact?: boolean
}

export function PickupTimeStepper({
  label,
  minutes,
  onChange,
  step = COOKING_TIME_STEP,
  min = COOKING_TIME_MIN,
  max = COOKING_TIME_MAX,
  hint,
  compact = false,
}: PickupTimeStepperProps) {
  const clamped = clampCookingMinutes(minutes)
  const atMin = clamped <= min
  const atMax = clamped >= max

  const bump = (delta: number) => {
    onChange(clampCookingMinutes(Math.min(max, Math.max(min, clamped + delta))))
  }

  return (
    <div className={[styles.wrap, compact ? styles.wrapCompact : ''].filter(Boolean).join(' ')}>
      <div className={styles.labelCol}>
        <span className={styles.label}>{label}</span>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </div>
      <div className={styles.controls} role="group" aria-label={label}>
        <button
          type="button"
          className={styles.stepBtn}
          disabled={atMin}
          aria-label={`${label} ${step}분 줄이기`}
          onClick={() => bump(-step)}
        >
          <Icon name="remove" />
        </button>
        <span className={styles.value}>{formatPickupMinutes(clamped)}</span>
        <button
          type="button"
          className={styles.stepBtn}
          disabled={atMax}
          aria-label={`${label} ${step}분 늘리기`}
          onClick={() => bump(step)}
        >
          <Icon name="add" />
        </button>
      </div>
    </div>
  )
}
