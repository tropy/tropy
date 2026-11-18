import { memo } from 'react'
import { useDispatch } from 'react-redux'
import cx from 'classnames'
import { Activity, CompletedActivity } from './activity.js'
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

  let handleSelect = (type) => {
    dispatch(act.nav.select({
      view: { name: 'activity', type }
    }, { throttle: true }))
  }

  return (
    <div
      className={cx('activity-pane', { busy: activities.length > 0 })}
      tabIndex={-1}>
      {activities.map(row => (row.status === 'busy') ? (
        <Activity
          key={row.key}
          id={row.key}
          type={row.type}
          progress={row.progress}
          total={row.total}
          canCancel={row.canCancel}
          onCancel={handleCancel}/>
      ) : (
        <CompletedActivity
          key={row.key}
          type={row.type}
          count={row.count}
          errors={row.errors}
          isActive={row.isActive}
          onDismiss={handleDismiss}
          onSelect={handleSelect}/>
      ))}
    </div>
  )
})
