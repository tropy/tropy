import { Icon } from '../icons.js'
import { useBusyActivities } from './use-busy-activities.js'

const ICON = 'Status'
const STYLE = { '--indeterminate': 'true' }
const TITLE = 'activity.status'

export const ActivityStatus = () => {
  let busy = useBusyActivities()

  if (busy.length === 0)
    return null

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
    <Icon
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
