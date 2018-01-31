'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { Toolbar, ToolGroup } = require('../toolbar')
const { IconChevron16 } = require('../icons')
const { Button } = require('../button')
const { MODE } = require('../../constants/project')
const { bool, func } = PropTypes


class ItemToolbar extends PureComponent {

  handleModeChange = () => {
    this.props.onModeChange(MODE.PROJECT)
  }

  render() {
    return (
      <Toolbar onDoubleClick={ARGS.frameless ? this.props.onMaximize : null}>
        <div className="toolbar-left">
          <ToolGroup>
            {this.props.isItemOpen &&
              <Button
                icon={<IconChevron16/>}
                onClick={this.handleModeChange}/>}
          </ToolGroup>
        </div>
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
