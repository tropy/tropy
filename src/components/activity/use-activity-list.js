import { useSelector } from 'react-redux'
import { selectCompletedActivities } from '../../slices/completed.js'
import { useBusyActivities } from './use-busy-activities.js'
import { useNow, useTick } from './clock.js'

/*
 * The rows of the activity pane:
 * busy activities, newest first,
 * then completed ones, most recent first.
 *
 * A completed row keeps its key (id) in this session,
 * so React re-uses the component as it changes status.
 */
export function useActivityList () {
  let now = useNow()
  let busy = useBusyActivities()
  let done = useSelector(state => selectCompletedActivities(state, now))
  let view = useSelector(state => state.nav.view)

  // Re-render when the next record expires
  useTick(Math.min(
    ...done.map(a => a.expires).filter(exp => exp > now)
  ), now)

  let isActive = (type, id = null) =>
    view.name === 'activity' && view.type === type && view.id === id

  return [
    ...busy.map(({ id, type, progress, total, cancel, items }) => ({
      key: id,
      id,
      type,
      status: 'busy',
      progress,
      total,
      canCancel: !!cancel,
      hasItems: items?.length > 0,
      isActive: isActive(type, id)
    })),
    ...done.map(({ id, type, items, errors }) => ({
      key: id ?? type,
      id,
      type,
      status: 'done',
      count: items?.length ?? 0,
      errors: errors ?? 0,
      hasItems: items?.length > 0,
      isActive: isActive(type)
    }))
  ]
}
