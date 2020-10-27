import React from 'react'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar'
import { IconChevron16 } from '../icons'
import { Button } from '../button'
import { Fade } from '../fx'
import { PROJECT } from '../../constants'
import { bool, func } from 'prop-types'

const { MODE } = PROJECT

export class ItemToolbar extends React.PureComponent {
  setProjectMode = () => {
    this.props.onModeChange(MODE.PROJECT)
  }

  render() {
    return (
      <Titlebar>
        <Toolbar.Left>
          <ToolGroup>
            <Fade in={this.props.isItemOpen}>
              <Button
                icon={<IconChevron16/>}
                onClick={this.setProjectMode}/>
            </Fade>
          </ToolGroup>
        </Toolbar.Left>
      </Titlebar>
    )
  }

  static propTypes = {
    isItemOpen: bool.isRequired,
    onModeChange: func.isRequired
  }
}
