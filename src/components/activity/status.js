import { useSelector } from 'react-redux'
import { FormattedIcon } from '../icons.js'
import { useBusyActivities } from './use-busy-activities.js'
import { useNow, useTick } from './clock.js'
import { selectMostRecentActivity } from '../../slices/activities.js'

const STYLE = { '--indeterminate': 'true' }
const TITLE = 'activity.status'

const variant = ({ agent, cloud }) => {
  if (agent) return 'AgentStatus'
  if (cloud) return 'CloudStatus'
  return 'Status'
}

export const ActivityStatus = () => {
  let busy = useBusyActivities()
  let now = useNow()
  let last = useSelector(state => selectMostRecentActivity(state, now))

  // Re-render when most recent expires
  useTick(last?.agent ? last.expires : Infinity, now)

  // If there's no busy activity,
  // we check if most recent activity was via agent
  if (busy.length === 0) {
    return last?.agent ? (
      <FormattedIcon
        name="AgentStatus"
        style={{ '--progress': 100 }}
        title="activity.agent"
        values={{ agent: last.agent }}/>
    ) : null
  }

  let {
    type,
    progress,
    total
  } = (busy.length === 1) ? busy[0] : {}

  // If multiple activities are ongoing,
  // we pick the common variant if possible.
  let name = variant(busy[0])
  if (busy.some(activity => variant(activity) !== name))
    name = 'Status'

  let hasProgressBar = progress > 0 && total > 0
  let title = type && `activity.${type}`
  let style = hasProgressBar
    ? { '--progress': Math.round(100 * (progress - 1) / total) }
    : null

  return (
    <FormattedIcon
      name={name}
      style={style || STYLE}
      title={title || TITLE}
      values={{
        count: busy.length,
        progress: progress - 1,
        total,
        hasProgressBar
      }}/>
  )
}
