'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { bool, element, func } = PropTypes
const { Toolbar, ToolGroup } = require('../toolbar')
const cx = require('classnames')

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


const EditorButton = ({ icon, isActive, isDisabled, ...props }) => (
  <span {...props}
    className={cx({ 'btn': true, 'btn-icon': true, 'active': isActive })}
    disabled={isDisabled}>
    {icon}
  </span>
)

EditorButton.propTypes = {
  icon: element.isRequired,
  isActive: bool,
  isDisabled: bool,
  onClick: func
}


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
              <EditorButton
                icon={<IconB/>}
                isActive={this.props.isBoldActive}
                onClick={this.bold}/>
              <EditorButton
                icon={<IconI/>}
                isActive={this.props.isItalicActive}
                onClick={this.italic}/>
              <EditorButton
                icon={<IconU/>}
                isActive={this.props.isUnderlineActive}
                onClick={this.underline}/>
              <EditorButton
                icon={<IconS/>}
                isActive={this.props.isStrikeThroughActive}
                onClick={this.strikethrough}/>
              <EditorButton
                icon={<IconQ/>}
                onClick={this.blockquote}/>
            </ToolGroup>
          }
          {this.props.hasListTools &&
            <ToolGroup>
              <EditorButton
                icon={<IconBulletList/>}
                onClick={this.ul}/>
              <EditorButton
                icon={<IconNumberedList/>}
                onClick={this.ol}/>
              <EditorButton
                icon={<IconSink/>}
                onClick={this.sinkListItem}/>
              <EditorButton
                icon={<IconLift/>}
                onClick={this.liftListItem}/>
            </ToolGroup>
          }
          {this.props.hasLinkTools &&
            <ToolGroup>
              <EditorButton
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
