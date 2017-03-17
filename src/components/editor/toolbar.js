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

              <EditorButton icon={<IconU/>} onClick={this.underline}/>
              <EditorButton icon={<IconS/>}/>
              <EditorButton icon={<IconQ/>}/>
            </ToolGroup>
          }
          {this.props.hasListTools &&
            <ToolGroup>
              <EditorButton icon={<IconBulletList/>}/>
              <EditorButton icon={<IconNumberedList/>}/>
              <EditorButton icon={<IconSink/>}/>
              <EditorButton icon={<IconLift/>}/>
            </ToolGroup>
          }
          {this.props.hasLinkTools &&
            <ToolGroup>
              <EditorButton icon={<IconLink/>}/>
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
