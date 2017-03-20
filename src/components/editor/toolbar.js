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
  constructor(props) {
    super(props)

    for (let action of [
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'blockquote',
      'ol',
      'ul',
      'liftListItem',
      'sinkListItem'
    ]) {
      this[action] = () => this.props.onCommand(action)
    }
  }

  render() {
    return (
      <Toolbar isDraggable={false}>
        <div className="toolbar-context active">
          <div className="toolbar-left">
            {this.props.hasMarkTools &&
              <ToolGroup>
                <IconButton
                  canHaveFocus={false}
                  icon={<IconB/>}
                  isActive={this.props.isBoldActive}
                  title="editor.commands.bold"
                  onMouseDown={this.bold}/>
                <IconButton
                  canHaveFocus={false}
                  icon={<IconI/>}
                  isActive={this.props.isItalicActive}
                  title="editor.commands.italic"
                  onMouseDown={this.italic}/>
                <IconButton
                  canHaveFocus={false}
                  icon={<IconU/>}
                  isActive={this.props.isUnderlineActive}
                  title="editor.commands.underline"
                  onMouseDown={this.underline}/>
                <IconButton
                  canHaveFocus={false}
                  icon={<IconS/>}
                  isActive={this.props.isStrikeThroughActive}
                  title="editor.commands.strikethrough"
                  onMouseDown={this.strikethrough}/>
                <IconButton
                  canHaveFocus={false}
                  icon={<IconQ/>}
                  title="editor.commands.blockquote"
                  onMouseDown={this.blockquote}/>
              </ToolGroup>
            }
            {this.props.hasListTools &&
              <ToolGroup>
                <IconButton
                  canHaveFocus={false}
                  icon={<IconBulletList/>}
                  title="editor.commands.ul"
                  onMouseDown={this.ul}/>
                <IconButton
                  canHaveFocus={false}
                  icon={<IconNumberedList/>}
                  title="editor.commands.ol"
                  onMouseDown={this.ol}/>
                <IconButton
                  canHaveFocus={false}
                  icon={<IconLift/>}
                  onMouseDown={this.liftListItem}/>
                <IconButton
                  canHaveFocus={false}
                  icon={<IconSink/>}
                  onMouseDown={this.sinkListItem}/>
              </ToolGroup>
            }
            {this.props.hasLinkTools &&
              <ToolGroup>
                <IconButton
                  isDisabled
                  canHaveFocus={false}
                  title="editor.commands.link"
                  icon={<IconLink/>}/>
              </ToolGroup>
            }
          </div>
        </div>
        <div className="toolbar-context">
          <span className="toolbar-left form-inline">
            <input type="text" className="form-control"
              placeholder="Link target"/>

            <span className="btn btn-primary">OK</span>
          </span>
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
