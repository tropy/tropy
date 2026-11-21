import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { TABS } from '../../constants/index.js'
import { Activity } from './activity.js'
import { useActivityList } from './use-activity-list.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import * as act from '../../actions/index.js'
import * as nav from '../../slices/nav/index.js'
import * as views from '../../slices/nav/view.js'

export const ActivityPane = memo(() => {
  let dispatch = useDispatch()
  let activities = useActivityList()

  // TODO
  // While we have no common cursor nav in the sidebar,
  // we move the tab-stop while in activity view.
  let isActivityView = useSelector(state =>
    nav.selectIsView(state, 'activity'))

  let handleCancel = (id) => {
    dispatch(act.activities.cancel(id))
  }
  let handleDismiss = (type, id) => {
    dispatch(act.activities.dismiss(type, id))
  }
  let handleSelect = (type, id) => {
    dispatch(nav.show({
      view: views.activity(type, id),
      query: '',
      tags: []
    }))
  }

  let handleKeyDown = useKeyMap('ActivityPane', isActivityView && {
    clear () {
      dispatch(nav.show({ view: views.project() }))
    }
  })

  return (
    <div
      className="activity-pane"
      tabIndex={isActivityView ? TABS.ProjectSidebar : -1}
      onKeyDown={handleKeyDown}>
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
