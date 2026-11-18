import { memo } from 'react'
import { useDispatch } from 'react-redux'
import { Activity } from './activity.js'
import { useActivityList } from './use-activity-list.js'
import * as act from '../../actions/index.js'

export const ActivityPane = memo(() => {
  let dispatch = useDispatch()
  let activities = useActivityList()

  let handleCancel = (id) => {
    dispatch(act.activity.cancel(id))
  }
  let handleDismiss = (type) => {
    dispatch(act.completed.dismiss(type))
  }
  let handleSelect = (type, id) => {
    dispatch(act.nav.select({
      view: { name: 'activity', type, id }
    }))
  }

  return (
    <div className="activity-pane" tabIndex={-1}>
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
