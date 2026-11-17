import { useSelector } from 'react-redux'
import { selectCompletedActivities } from '../../slices/completed.js'
import { useNow, useTick } from './clock.js'

export function useCompletedActivities () {
  let now = useNow()
  let completed = useSelector(state => selectCompletedActivities(state, now))

  // When the next record expires
  // (the record shown may have expired already).
  useTick(Math.min(...completed
    .map(rec => rec.expires)
    .filter(at => at > now)), now)

  return completed
}
