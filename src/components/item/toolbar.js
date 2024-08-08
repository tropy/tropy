import React, { useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar.js'
import { Button } from '../button.js'
import { Fade } from '../fx.js'
import { mode } from '../../actions/nav.js'

export const ItemToolbar = ({ isItemMode }) => {
  let dispatch = useDispatch()
  let ref = useRef(null)

  let toggleProjectMode = useEvent(() => {
    dispatch(mode.project())
  })

  return (
    <Titlebar>
      <Toolbar.Left>
        <ToolGroup>
          <Fade nodeRef={ref} in={isItemMode}>
            <Button
              ref={ref}
              icon="IconChevron16"
              noFocus
              onClick={toggleProjectMode}/>
          </Fade>
        </ToolGroup>
      </Toolbar.Left>
    </Titlebar>
  )
}
