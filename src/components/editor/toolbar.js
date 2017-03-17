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

  bold = () => this.props.onCommand('bold')
  italic = () => this.props.onCommand('italic')
  underline = () => this.props.onCommand('underline')
  strikethrough = () => this.props.onCommand('strikethrough')
  blockquote = () => this.props.onCommand('blockquote')
  ol = () => this.props.onCommand('ol')
  ul = () => this.props.onCommand('ul')
  liftListItem = () => this.props.onCommand('liftListItem')
  sinkListItem = () => this.props.onCommand('sinkListItem')

  render() {
    return (
      <Toolbar isDraggable={false}>
        <div className="toolbar-left">
          {this.props.hasMarkTools &&
            <ToolGroup>
              <IconButton
                canHaveFocus={false}
                icon={<IconB/>}
                isActive={this.props.isBoldActive}
                onClick={this.bold}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconI/>}
                isActive={this.props.isItalicActive}
                onClick={this.italic}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconU/>}
                isActive={this.props.isUnderlineActive}
                onClick={this.underline}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconS/>}
                isActive={this.props.isStrikeThroughActive}
                onClick={this.strikethrough}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconQ/>}
                onClick={this.blockquote}/>
            </ToolGroup>
          }
          {this.props.hasListTools &&
            <ToolGroup>
              <IconButton
                canHaveFocus={false}
                icon={<IconBulletList/>}
                onClick={this.ul}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconNumberedList/>}
                onClick={this.ol}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconSink/>}
                onClick={this.sinkListItem}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconLift/>}
                onClick={this.liftListItem}/>
            </ToolGroup>
          }
          {this.props.hasLinkTools &&
            <ToolGroup>
              <IconButton
                canHaveFocus={false}
                icon={<IconLink/>}/>
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
    isBoldActive: bool,
    isItalicActive: bool,
    isUnderlineActive: bool,
    isStrikeThroughActive: bool,
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
