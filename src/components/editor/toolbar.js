'use strict'

const React = require('react')
const { PureComponent } = React
const { func, instanceOf } = require('prop-types')
const { Toolbar, ToolbarContext, ToolGroup } = require('../toolbar')
const { IconButton } = require('../button')
const { EditorState } = require('prosemirror-state')
const { LinkToolbar } = require('./link')


const {
  IconB,
  IconI,
  IconU,
  IconO,
  IconS,
  IconQ,
  IconSup,
  IconSub,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconBulletList,
  IconNumberedList,
  IconSink,
  IconLift,
  IconLink
} = require('../icons')


class EditorToolbar extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      align: this.getActiveAlignment(props.state),
      context: 'default',
      marks: this.getActiveMarks(props.state),
    }

    this.cmd = {}

    for (const action of [
      'bold',
      'italic',
      'underline',
      'overline',
      'strikethrough',
      'subscript',
      'superscript',
      'blockquote',
      'ol',
      'ul',
      'liftListItem',
      'sinkListItem',
      'left',
      'center',
      'right'
    ]) {
      this.cmd[action] = () => this.props.onCommand(action)
    }
  }

  componentWillReceiveProps(props) {
    if (props.state !== this.props.state) {
      this.setState({
        align: this.getActiveAlignment(props.state),
        marks: this.getActiveMarks(props.state)
      })
    }
  }

  get hasDefaultContext() {
    return this.state.context === 'default'
  }

  get hasLinkContext() {
    return this.state.context === 'link'
  }

  getActiveMarks(state = this.props.state) {
    const marks = {}

    for (const mark in state.schema.marks) {
      marks[mark] = this.isMarkActive(state.schema.marks[mark], state)
    }

    return marks
  }

  getActiveAlignment(state = this.props.state) {
    const align = { left: false, right: false, center: false }

    state.doc.nodesBetween(
      state.selection.from,
      state.selection.to,
      (node) => {
        if (node.type.attrs.align) {
          align[node.attrs.align] = true
        }
      })

    return align
  }

  isMarkActive(type, state = this.props.state) {
    const { from, $from, to, empty } = state.selection

    return (empty) ?
      !!type.isInSet(state.storedMarks || $from.marks()) :
      state.doc.rangeHasMark(from, to, type)
  }

  renderButton(name, props) {
    return (
      <IconButton
        {...props}
        noFocus
        title={`editor.commands.${name}`}
        onMouseDown={this.cmd[name]}/>
    )
  }

  renderMarkButton(name, icon) {
    return this.renderButton(name, {
      icon,
      isActive: this.state.marks[name]
    })
  }


  renderAlignButton(name, icon) {
    return this.renderButton(name, {
      icon,
      isActive: this.state.align[name]
    })
  }

  setDefaultContext = () => {
    this.setState({ context: 'default' })
  }

  setLinkContext = () => {
    this.setState({ context: 'link' })
  }

  handleLinkToggle = (attrs) => {
    // expand selection to include full link (only when deleting)
    if (this.state.marks.link) {
      this.props.onCommand('removeLink')
    } else {
      this.props.onCommand('insertLink', attrs)
    }
    this.setDefaultContext()
  }

  handleLinkButtonClick = () => {
    if (this.state.marks.link) this.handleLinkToggle()
    else this.setLinkContext()
  }

  render() {
    return (
      <Toolbar isDraggable={false}>
        <ToolbarContext
          className="default"
          isActive={this.hasDefaultContext}>
          <div className="toolbar-left">
            <ToolGroup>
              {this.renderMarkButton('bold', <IconB/>)}
              {this.renderMarkButton('italic', <IconI/>)}
              {this.renderMarkButton('underline', <IconU/>)}
              {this.renderMarkButton('overline', <IconO/>)}
              {this.renderMarkButton('strikethrough', <IconS/>)}
              <IconButton
                noFocus
                icon={<IconQ/>}
                title="editor.commands.blockquote"
                onMouseDown={this.cmd.blockquote}/>
            </ToolGroup>
            <ToolGroup>
              {this.renderMarkButton('superscript', <IconSup/>)}
              {this.renderMarkButton('subscript', <IconSub/>)}
            </ToolGroup>
            <ToolGroup>
              {this.renderAlignButton('left', <IconAlignLeft/>)}
              {this.renderAlignButton('center', <IconAlignCenter/>)}
              {this.renderAlignButton('right', <IconAlignRight/>)}
            </ToolGroup>
            <ToolGroup>
              <IconButton
                noFocus
                icon={<IconBulletList/>}
                title="editor.commands.ul"
                onMouseDown={this.cmd.ul}/>
              <IconButton
                noFocus
                icon={<IconNumberedList/>}
                title="editor.commands.ol"
                onMouseDown={this.cmd.ol}/>
              <IconButton
                noFocus
                icon={<IconSink/>}
                title="editor.commands.sinkListItem"
                onMouseDown={this.cmd.sinkListItem}/>
              <IconButton
                noFocus
                icon={<IconLift/>}
                title="editor.commands.liftListItem"
                onMouseDown={this.cmd.liftListItem}/>
            </ToolGroup>
            <ToolGroup>
              <IconButton
                noFocus
                isActive={this.state.marks.link}
                title="editor.commands.link.button"
                icon={<IconLink/>}
                onMouseDown={this.handleLinkButtonClick}/>
            </ToolGroup>
          </div>
        </ToolbarContext>
        <LinkToolbar
          isActive={this.hasLinkContext}
          onCancel={this.setDefaultContext}
          onCommit={this.handleLinkToggle}/>
      </Toolbar>
    )
  }

  static propTypes = {
    state: instanceOf(EditorState),
    onCommand: func.isRequired
  }

  static defaultProps = {
  }
}

module.exports = {
  EditorToolbar
}
