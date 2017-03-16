'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { bool, func } = PropTypes
const { Toolbar, ToolGroup } = require('../toolbar')
const { IconButton } = require('../button')

const {
  IconB,
  IconI,
  IconU,
  IconS,
  IconQ,
  IconLink,
  IconBulletList,
  IconNumberedList,
  IconSink,
  IconLift
} = require('../icons')


class EditorToolbar extends PureComponent {

  handleBold = () => this.props.onCommand('bold')
  handleItalics = () => this.props.onCommand('italics')

  render() {
    return (
      <Toolbar isDraggable={false}>
        <div className="toolbar-left">
          {this.props.hasMarkTools &&
            <ToolGroup>
              <IconButton icon={<IconB/>} onClick={this.handleBold}/>
              <IconButton icon={<IconI/>}/>
              <IconButton icon={<IconU/>}/>
              <IconButton icon={<IconS/>}/>
              <IconButton icon={<IconQ/>}/>
            </ToolGroup>
          }
          {this.props.hasListTools &&
            <ToolGroup>
              <IconButton icon={<IconBulletList/>}/>
              <IconButton icon={<IconNumberedList/>}/>
              <IconButton icon={<IconSink/>}/>
              <IconButton icon={<IconLift/>}/>
            </ToolGroup>
          }
          {this.props.hasLinkTools &&
            <ToolGroup>
              <IconButton icon={<IconLink/>}/>
            </ToolGroup>
          }
        </div>
      </Toolbar>
    )
  }

  static propTypes = {
    hasMarkTools: bool,
    hasListTools: bool,
    hasLinkTools: bool,
    onCommand: func.isRequired
  }

  static defaultProps = {
    hasMarkTools: true,
    hasListTools: true,
    hasLinkTools: true
  }
}

module.exports = {
  EditorToolbar
}
