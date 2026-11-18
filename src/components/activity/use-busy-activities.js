import { useSelector } from 'react-redux'
import { selectActivities } from '../../slices/activities.js'
import { useNow, useTick } from './clock.js'

const isSuspended = (activity) =>
  activity.suspended != null

export function useBusyActivities () {
  let now = useNow()

  let pending = useSelector(selectActivities).filter(a => !isSuspended(a))
  let busy = pending.filter(a => now >= a.due)

  // Re-render on next due date!
  useTick(Math.min(
    ...pending.map(a => a.due).filter(due => due > now)
  ), now)

  return busy
}
