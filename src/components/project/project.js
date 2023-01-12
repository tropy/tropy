import React from 'react'
import { bool, number } from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { useDerivedState } from '../../hooks/use-derived-state.js'
import { useTransitionState } from '../../hooks/use-transition-state.js'
import { useEvent } from '../../hooks/use-event.js'
import { useGlobalEvent } from '../../hooks/use-global-event.js'
import { useGlobalKeys } from '../../hooks/use-global-keys.js'
import { ProjectView } from './view.js'
import { ItemView } from '../item/view.js'
import { DragLayer } from '../drag-layer.js'
import { MODE } from '../../constants/nav.js'
import * as act from '../../actions/index.js'


const modeToString = (mode) =>
  `${mode}-mode`


export const ProjectClosed = () =>
  <div className="project closed"/>


export const Project = React.forwardRef(({
  isOver,
  project,
  timeout
}, drop) => {

  let dispatch = useDispatch()

  let nav = useSelector(state => state.nav)
  let [mode, container] = useTransitionState(nav.mode, timeout, modeToString)

  let isItemMode = !!(
    (mode.current === MODE.ITEM) ^ mode.isChanging
  )

  drop?.(container)

  let keymap = useSelector(state => state.keymap.global)
  useGlobalKeys(keymap)

  useGlobalEvent('back', () => {
    if (isItemMode)
      dispatch(act.nav.mode.project())
  })

  // TODO use event propagation instead of passing down callback!
  let handleContextMenu = useEvent((event, ...args) => {
    event.stopPropagation()
    dispatch(act.context.show(event, ...args))
  })

  let panel = useSelector(state => state.ui.panel)
  let [offset, setOffset] = useDerivedState(panel.width)

  let handlePanelResize = useEvent(({ value }) => {
    setOffset(value)
  })

  let handlePanelDragStop = useEvent(() => {
    dispatch(act.ui.update({
      panel: { width: Math.round(offset) }
    }))
  })

  if (project.closed)
    return <ProjectClosed/>

  return (
    <div
      ref={container}
      className={cx('project', mode.className, {
        closing: project.isClosing,
        over: isOver
      })}
      onContextMenu={handleContextMenu}>

      <ProjectView
        isDisabled={isItemMode}
        offset={offset}
        onContextMenu={handleContextMenu}
        project={project}/>

      <ItemView
        isItemMode={isItemMode}
        isProjectClosing={project.isClosing}
        isReadOnly={project.isReadOnly || nav.trash}
        offset={offset}
        panel={panel}
        onContextMenu={handleContextMenu}
        onPanelDragStop={handlePanelDragStop}
        onPanelResize={handlePanelResize}/>

      <DragLayer/>
      <div className="cover"/>
    </div>
  )
})

Project.propTypes = {
  isOver: bool,
  project: bool,
  timeout: number
}

Project.defaultProps = {
  timeout: 3000
}
