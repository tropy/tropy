import { useSelector } from 'react-redux'
import { selectCompletedActivities } from '../../slices/completed.js'
import { useNow, useTick } from './clock.js'

export function useCompletedActivities () {
  let now = useNow()
  let completed = useSelector(state => selectCompletedActivities(state, now))

  // When the next record expires.
  useTick(Math.min(...completed.map(rec => rec.expires)), now)

  return completed
}
