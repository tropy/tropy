import { memo } from 'react'
import { useDispatch } from 'react-redux'
import cx from 'classnames'
import { Activity } from './activity.js'
import { useActivityList } from './use-activity-list.js'
import { useEvent } from '../../hooks/use-event.js'
import * as act from '../../actions/index.js'

export const ActivityPane = memo(() => {
  let dispatch = useDispatch()
  let activities = useActivityList()

  let handleCancel = useEvent((id) => {
    dispatch(act.activity.cancel(id))
  })

  let handleDismiss = (type) => {
    dispatch(act.completed.dismiss(type))
  }

  let handleSelect = (type, id) => {
    dispatch(act.nav.select({
      view: { name: 'activity', type, id }
    }))
  }

  return (
    <div
      className={cx('activity-pane', {
        busy: activities.length > 0
      })}
      tabIndex={-1}>
      {activities.map(({ key, ...props }) => (
        <Activity
          key={key}
          {...props}
          onCancel={handleCancel}
          onDismiss={handleDismiss}
          onSelect={handleSelect}/>
      ))}
    </div>
  )
})
