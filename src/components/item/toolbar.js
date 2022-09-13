import React from 'react'
import { bool } from 'prop-types'
import { useDispatch } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar.js'
import { IconChevron16 } from '../icons.js'
import { Button } from '../button.js'
import { Fade } from '../fx.js'
import { mode } from '../../actions/nav.js'

export const ItemToolbar = ({ isItemMode }) => {
  let dispatch = useDispatch()

  let toggleProjectMode = useEvent(() => {
    dispatch(mode.project())
  })

  return (
    <Titlebar>
      <Toolbar.Left>
        <ToolGroup>
          <Fade in={isItemMode}>
            <Button
              icon={<IconChevron16/>}
              noFocus
              onClick={toggleProjectMode}/>
          </Fade>
        </ToolGroup>
      </Toolbar.Left>
    </Titlebar>
  )
}

ItemToolbar.propTypes = {
  isItemMode: bool
}
