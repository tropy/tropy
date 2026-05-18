import { useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { useOnline } from '../../hooks/use-online.js'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar.js'
import { Button } from '../button.js'
import { Icon } from '../icons.js'
import { Fade } from '../fx.js'
import { mode } from '../../actions/nav.js'

export const ItemToolbar = ({ isItemMode }) => {
  let dispatch = useDispatch()
  let online = useOnline()

  let bref = useRef(null)
  let oref = useRef(null)

  let toggleProjectMode = useEvent(() => {
    dispatch(mode.project())
  })

  return (
    <Titlebar>
      <Toolbar.Left>
        <ToolGroup>
          <Fade nodeRef={bref} in={isItemMode}>
            <Button
              ref={bref}
              icon="IconChevron16"
              noFocus
              onClick={toggleProjectMode}/>
          </Fade>
        </ToolGroup>
      </Toolbar.Left>
      <Toolbar.Right>
        <Fade nodeRef={bref} in={!online}>
          <Icon
            ref={oref}
            name="Ghost"
            title="toolbar.offline"/>
        </Fade>
      </Toolbar.Right>
    </Titlebar>
  )
}
