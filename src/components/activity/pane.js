import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { Activity, CompletedActivity } from './activity.js'
import { useBusyActivities } from './use-busy-activities.js'
import { useCompletedActivities } from './use-completed-activities.js'
import { useEvent } from '../../hooks/use-event.js'
import * as act from '../../actions/index.js'

export const ActivityPane = memo(() => {
  let dispatch = useDispatch()
  let busy = useBusyActivities()
  let completed = useCompletedActivities()
  let view = useSelector(state => state.nav.view)
  let selected = (view.name === 'activity' && view.seq == null) ?
    view.type : null
  let rows = busy.length + completed.length

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
      className={cx('activity-pane', { busy: rows > 0 })}
      tabIndex={-1}>
      {busy.map(({ id, cancel, type, progress, total }) => (
        <Activity
          key={id}
          id={id}
          type={type}
          progress={progress}
          total={total}
          canCancel={cancel}
          onCancel={handleCancel}/>
      ))}
      {completed.map(({ type, items, errors }) => (
        <CompletedActivity
          key={type}
          type={type}
          count={items?.length ?? 0}
          errors={errors ?? 0}
          isActive={type === selected}
          onDismiss={handleDismiss}
          onSelect={handleSelect}/>
      ))}
    </div>
  )
})
