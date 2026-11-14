import { useSelector } from 'react-redux'
import { getActivities } from '../../selectors/index.js'
import { useNow, useTick } from './clock.js'

const isSuspended = (activity) =>
  activity.suspended != null

export function useBusyActivities () {
  let activities = useSelector(getActivities)
  let now = useNow()

  let busy = activities
    .filter(a => now >= a.due && !isSuspended(a))

  // When the next pending activity becomes due.
  let next = Math.min(
    ...activities
      .filter(a => !isSuspended(a))
      .map(a => a.due)
      .filter(due => due > now))

  useTick(next, now)

  return busy
}
