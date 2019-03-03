'use strict'

const React = require('react')
const { Toolbar, ToolGroup } = require('../toolbar')
const { IconChevron16 } = require('../icons')
const { Button } = require('../button')
const { Fade } = require('../fx')
const { MODE } = require('../../constants/project')
const { bool, func } = require('prop-types')


class ItemToolbar extends React.PureComponent {
  setProjectMode = () => {
    this.props.onModeChange(MODE.PROJECT)
  }

  render() {
    return (
      <Toolbar onDoubleClick={ARGS.frameless ? this.props.onMaximize : null}>
        <Toolbar.Left>
          <ToolGroup>
            <Fade in={this.props.isItemOpen}>
              <Button
                icon={<IconChevron16/>}
                onClick={this.setProjectMode}/>
            </Fade>
          </ToolGroup>
        </Toolbar.Left>
      </Toolbar>
    )
  }

  static propTypes = {
    isItemOpen: bool.isRequired,
    onMaximize: func.isRequired,
    onModeChange: func.isRequired
  }
}

module.exports = {
  ItemToolbar
}
