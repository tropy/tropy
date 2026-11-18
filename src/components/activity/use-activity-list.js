import { useSelector } from 'react-redux'
import { selectPastActivities } from '../../slices/activities.js'
import { useBusyActivities } from './use-busy-activities.js'
import { useNow, useTick } from './clock.js'

/*
 * The rows of the activity pane:
 * busy and past activities, sorted by sequential id,
 * past activities without an id (restored) last.
 *
 * A past row keeps its key (id) in this session,
 * so React re-uses the component as it changes status.
 */
export function useActivityList () {
  let now = useNow()
  let busy = useBusyActivities()
  let past = useSelector(state => selectPastActivities(state, now))
  let view = useSelector(state => state.nav.view)

  // Re-render when the next record expires
  useTick(Math.min(
    ...past.map(a => a.expires).filter(exp => exp > now)
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
    ...past.map(({ id, type, items, errors }) => ({
      key: id ?? type,
      id,
      type,
      status: 'past',
      count: items?.length ?? 0,
      errors: errors ?? 0,
      hasItems: items?.length > 0,
      isActive: isActive(type)
    }))
  ].sort(byId)
}

const byId = (a, b) =>
  (a.id == null) - (b.id == null) || (b.id ?? 0) - (a.id ?? 0)
