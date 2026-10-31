import { memo } from 'react'
import { useDispatch } from 'react-redux'
import cx from 'classnames'
import { Activity } from './activity.js'
import { useBusyActivities } from './use-busy-activities.js'
import { useEvent } from '../../hooks/use-event.js'
import { SASS } from '../../constants/index.js'
import * as act from '../../actions/index.js'

export const ActivityPane = memo(({
  height = SASS.ACTIVITY.HEIGHT
}) => {
  let dispatch = useDispatch()
  let busy = useBusyActivities()

  let handleCancel = useEvent((id) => {
    dispatch(act.activity.cancel(id))
  })

  return (
    <div
      className={cx('activity-pane', { busy: busy.length > 0 })}
      style={{ height: busy.length * height }}>
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
    </div>
  )
})
