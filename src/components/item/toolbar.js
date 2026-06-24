import { useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar.js'
import { Button } from '../button.js'
import { AccountStatus } from '../account/status.js'
import { Fade } from '../fx.js'
import { mode } from '../../actions/nav.js'

export const ItemToolbar = ({ isItemMode }) => {
  let dispatch = useDispatch()
  let nodeRef = useRef(null)

  let toggleProjectMode = useEvent(() => {
    dispatch(mode.project())
  })

  return (
    <Titlebar>
      <Toolbar.Left>
        <ToolGroup>
          <Fade nodeRef={nodeRef} in={isItemMode}>
            <Button
              ref={nodeRef}
              icon="IconChevron16"
              noFocus
              onClick={toggleProjectMode}/>
          </Fade>
        </ToolGroup>
      </Toolbar.Left>
      <Toolbar.Right>
        <AccountStatus/>
      </Toolbar.Right>
    </Titlebar>
  )
}
