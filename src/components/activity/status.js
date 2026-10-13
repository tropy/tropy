import { Icon } from '../icons.js'
import { useBusyActivities } from './use-busy-activities.js'

const ICON = 'Status'
const STYLE = { '--indeterminate': 'true' }
const TITLE = 'activity.status'

export const ActivityStatus = ({ delay }) => {
  let busy = useBusyActivities(delay)

  if (busy.length === 0)
    return null

  if (busy.length === 1) {
    var { statusIcon, type, progress, total } = busy[0]
    var hasProgressBar = progress > 0 && total > 0
    var title = `activity.${type}`

    if (hasProgressBar)
      var style = { '--progress': Math.round(100 * progress / total) }
  }

  return (
    <Icon
      name={statusIcon || ICON}
      style={style || STYLE}
      title={title || TITLE}
      values={{ count: busy.length, progress, total, hasProgressBar }}/>
  )
}
