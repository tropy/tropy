'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { bool, func, shape, string } = PropTypes
const { Toolbar, ToolbarContext, ToolGroup } = require('../toolbar')
const { IconButton } = require('../button')

const {
  IconB,
  IconI,
  IconU,
  IconS,
  IconQ,
  IconSup,
  IconSub,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
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
      'subscript',
      'superscript',
      'blockquote',
      'ol',
      'ul',
      'liftListItem',
      'sinkListItem'
    ]) {
      this[action] = () => this.props.onCommand(action)
    }
  }

  get isLinkActive() {
    return !!this.props.link
  }

  render() {
    return (
      <Toolbar isDraggable={false}>
        <ToolbarContext isActive={!this.isLinkActive}>
          <div className="toolbar-left">
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
            <ToolGroup>
              <IconButton
                canHaveFocus={false}
                icon={<IconSup/>}
                isActive={this.props.isSuperScriptActive}
                title="editor.commands.superscript"
                onMouseDown={this.superscript}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconSub/>}
                isActive={this.props.isSubScriptActive}
                title="editor.commands.subscript"
                onMouseDown={this.subscript}/>
            </ToolGroup>
            <ToolGroup>
              <IconButton
                canHaveFocus={false}
                icon={<IconAlignLeft/>}
                isActive={false}
                title="editor.commands.left"
                onMouseDown={this.superscript}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconAlignCenter/>}
                isActive={false}
                title="editor.commands.center"
                onMouseDown={this.superscript}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconAlignRight/>}
                isActive={false}
                title="editor.commands.right"
                onMouseDown={this.superscript}/>
            </ToolGroup>
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
            <ToolGroup>
              <IconButton
                isDisabled
                canHaveFocus={false}
                title="editor.commands.link"
                icon={<IconLink/>}/>
            </ToolGroup>
          </div>
        </ToolbarContext>
        <ToolbarContext isActive={this.isLinkActive}>
          <span className="toolbar-left form-inline">
            <input
              className="form-control link-target"
              type="text"
              tabIndex={-1}
              value={this.props.link}
              placeholder="Link target"/>

            <span className="btn btn-primary">OK</span>
          </span>
        </ToolbarContext>
      </Toolbar>
    )
  }

  static propTypes = {
    isBoldActive: bool,
    isItalicActive: bool,
    isUnderlineActive: bool,
    isStrikethroughActive: bool,
    isSubscriptActive: bool,
    isSuperscriptActive: bool,

    link: shape({
      target: string.isRequired
    }),

    onCommand: func.isRequired
  }

  static defaultProps = {
  }
}

module.exports = {
  EditorToolbar
}
