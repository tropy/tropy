import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { Activity, CompletedActivity } from './activity.js'
import { useBusyActivities } from './use-busy-activities.js'
import { useCompletedActivities } from './use-completed-activities.js'
import { useEvent } from '../../hooks/use-event.js'
import { SASS } from '../../constants/index.js'
import * as act from '../../actions/index.js'

export const ActivityPane = memo(({
  height = SASS.ACTIVITY.HEIGHT
}) => {
  let dispatch = useDispatch()
  let busy = useBusyActivities()
  let completed = useCompletedActivities()
  let selected = useSelector(state => state.nav.activity)
  let rows = busy.length + completed.length

  let handleCancel = useEvent((id) => {
    dispatch(act.activity.cancel(id))
  })

  let handleDismiss = useEvent((type) => {
    dispatch(act.completed.dismiss(type, { search: type === selected }))
  })

  let handleSelect = useEvent((type) => {
    dispatch(act.nav.select({ activity: type }, { throttle: true }))
  })

  return (
    <div
      className={cx('activity-pane', { busy: rows > 0 })}
      style={{ height: rows * height }}>
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
      {completed.map(({ type, count, errors, cancelled }) => (
        <CompletedActivity
          key={type}
          type={type}
          count={count}
          errors={errors}
          cancelled={cancelled}
          isActive={type === selected}
          onDismiss={handleDismiss}
          onSelect={handleSelect}/>
      ))}
    </div>
  )
})
