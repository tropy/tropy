import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { TABS } from '../../constants/index.js'
import { Activity } from './activity.js'
import { useActivityList } from './use-activity-list.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import * as act from '../../actions/index.js'

export const ActivityPane = memo(() => {
  let dispatch = useDispatch()
  let activities = useActivityList()

  // TODO
  // While we have no common cursor nav in the sidebar,
  // we move the tab-stop while in activity view.
  let isActivityView = useSelector(state =>
    state.nav.view.name === 'activity')

  let handleCancel = (id) => {
    dispatch(act.activities.cancel(id))
  }
  let handleDismiss = (type) => {
    dispatch(act.activities.dismiss(type))
  }
  let handleSelect = (type, id) => {
    dispatch(act.nav.select({
      view: { name: 'activity', type, id }
    }))
  }

  let handleKeyDown = useKeyMap('ActivityPane', isActivityView && {
    clear () {
      dispatch(act.nav.select({ view: { name: 'project' } }))
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
