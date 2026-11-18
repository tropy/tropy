import { useSelector } from 'react-redux'
import { FormattedIcon } from '../icons.js'
import { useBusyActivities } from './use-busy-activities.js'
import { useNow, useTick } from './clock.js'
import { selectMostRecentActivity } from '../../slices/activities.js'

const ICON = 'Status'
const STYLE = { '--indeterminate': 'true' }
const TITLE = 'activity.status'

export const ActivityStatus = () => {
  let busy = useBusyActivities()
  let now = useNow()
  let last = useSelector(state => selectMostRecentActivity(state, now))

  // When the agent's record expires.
  useTick(last?.agent ? last.expires : Infinity, now)

  // Without busy activities, shows if an agent completed the last one.
  if (busy.length === 0) {
    return last?.agent ? (
      <FormattedIcon
        name="Flash"
        style={{ '--progress': 100 }}
        title="activity.agent"
        values={{ agent: last.agent }}/>
    ) : null
  }

  let {
    statusIcon,
    type,
    progress,
    total
  } = (busy.length === 1) ? busy[0] : {}

  let hasProgressBar = progress > 0 && total > 0
  let title = type && `activity.${type}`
  let style = hasProgressBar
    ? { '--progress': Math.round(100 * (progress - 1) / total) }
    : null

  return (
    <FormattedIcon
      name={statusIcon || ICON}
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
