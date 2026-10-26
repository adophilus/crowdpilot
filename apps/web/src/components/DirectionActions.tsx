import { Link } from '@tanstack/react-router'
import { updateWorkspace, useWorkspace } from '../lib/workspace'
import { Icon } from './ui'

// Proceed / Not now / Undo — shared by Home and Directions so a pick made on
// one screen shows on the other (and in Plans).
export function DirectionActions({
  id,
  takenLabel,
  viewPlan
}: {
  id: string
  takenLabel: string
  viewPlan?: boolean
}) {
  const { picks } = useWorkspace()
  const s = picks[id]
  const set = (v: 'taken' | 'skip' | null) =>
    updateWorkspace((w) => {
      const next = { ...w.picks }
      if (v) next[id] = v
      else delete next[id]
      return { picks: next }
    })

  if (s === 'taken') {
    return (
      <>
        <div role="status" className="state-ok">
          <Icon name="check" size={14} stroke={2.8} />
          {takenLabel}
        </div>
        {viewPlan && (
          <Link to="/plans" search={{ plan: id }} className="btn-ghost-sm">
            View plan
          </Link>
        )}
      </>
    )
  }
  if (s === 'skip') {
    return (
      <button type="button" className="btn-undo" onClick={() => set(null)}>
        Hidden · Undo
      </button>
    )
  }
  return (
    <>
      <button
        className="btn btn-accent btn-grow"
        type="button"
        onClick={() => set('taken')}
      >
        Proceed
      </button>
      <button type="button" className="btn-quiet" onClick={() => set('skip')}>
        Not now
      </button>
    </>
  )
}
