import { useSelector } from 'react-redux'
import { getCompletedActivities } from '../../selectors/index.js'
import { useNow, useTick } from './clock.js'

export function useCompletedActivities () {
  let now = useNow()
  let completed = useSelector(state => getCompletedActivities(state, now))

  // When the next run expires.
  useTick(Math.min(...completed.map(a => a.expires)), now)

  return completed
}
