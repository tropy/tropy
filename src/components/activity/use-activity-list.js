import { useSelector } from 'react-redux'
import { useBusyActivities } from './use-busy-activities.js'
import { useNow, useTick } from './clock.js'
import {
  selectSelectedActivity,
  selectPastActivities
} from '../../slices/activities.js'

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
  let selected = useSelector(selectSelectedActivity)

  // Re-render when the next record expires
  useTick(Math.min(
    ...past.map(a => a.expires).filter(exp => exp > now)
  ), now)

  return [
    ...busy.map(activity => ({
      key: activity.id,
      id: activity.id,
      type: activity.type,
      status: 'busy',
      progress: activity.progress,
      total: activity.total,
      canCancel: !!activity.cancel,
      hasItems: activity.items?.length > 0,
      isSelected: activity === selected
    })),
    ...past.map(activity => ({
      key: activity.id ?? activity.type,
      id: activity.id,
      type: activity.type,
      status: 'past',
      count: activity.items?.length ?? 0,
      errors: activity.errors ?? 0,
      hasItems: activity.items?.length > 0,
      isSelected: activity === selected
    }))
  ].sort(byId)
}

const byId = (a, b) =>
  (a.id == null) - (b.id == null) || (b.id ?? 0) - (a.id ?? 0)
