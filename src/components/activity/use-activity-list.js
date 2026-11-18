import { useSelector } from 'react-redux'
import { selectCompletedActivities } from '../../slices/completed.js'
import { useBusyActivities } from './use-busy-activities.js'
import { useNow, useTick } from './clock.js'

/*
 * The list of activities for the activity pane.
 * Live activities first, then completed ones.
 */
export function useActivityList () {
  let busy = useBusyActivities()
  let now = useNow()
  let completed = useSelector(state => selectCompletedActivities(state, now))
  let view = useSelector(state => state.nav.view)

  // Re-render when the next record expires
  useTick(Math.min(
    ...completed.map(a => a.expires).filter(exp => exp > now)
  ), now)

  let isActive = (type, id = null) =>
    view.name === 'activity' && view.type === type && view.id === id

  return [
    ...busy
      .toSorted((a, b) => b.id - a.id)
      .map(({ id, type, progress, total, cancel, items }) => ({
        key: id,
        type,
        status: 'busy',
        progress,
        total,
        canCancel: !!cancel,
        hasItems: items?.length > 0,
        isActive: isActive(type, id)
      })),
    ...completed
      .map(({ id, type, items, errors }) => ({
        key: id ?? type,
        type,
        status: 'done',
        count: items?.length ?? 0,
        errors: errors ?? 0,
        hasItems: items?.length > 0,
        isActive: isActive(type)
      }))
  ]
}
