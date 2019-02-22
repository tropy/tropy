'use strict'

const React = require('react')
const { Toolbar, ToolGroup } = require('../toolbar')
const { Button } = require('../button')
const { EditorState } = require('prosemirror-state')
const { LinkContext } = require('./link')
const memoize = require('memoize-one')
const { bool, func, instanceOf, string } = require('prop-types')
const icons = require('../icons')


class EditorToolbar extends React.PureComponent {
  state = {
    context: 'default'
  }

  get align() {
    return this.getActiveAlignment(this.props.state)
  }

  get marks() {
    return this.getActiveMarks(this.props.state)
  }

  getActiveMarks = memoize(state => {
    let marks = {}
    for (let mark in state.schema.marks) {
      marks[mark] = isMarkActive(state.schema.marks[mark], state)
    }
    return marks
  })

  getActiveAlignment = memoize(state => {
    let align = { left: false, right: false, center: false }

    state.doc.nodesBetween(
      state.selection.from,
      state.selection.to,
      (node) => {
        if (node.type.attrs.align) {
          align[node.attrs.align] = true
        }
      })

    return align
  })

  setDefaultContext = () => {
    this.setState({ context: 'default' })
  }

  setLinkContext = () => {
    this.setState({ context: 'link' })
  }

  handleCommand(cmd) {
    return () => this.props.onCommand(cmd)
  }

  handleLinkToggle = (attrs) => {
    // Expand selection to include full link (only when deleting)
    if (this.marks.link) {
      this.props.onCommand('removeLink')
    } else {
      this.props.onCommand('insertLink', attrs)
    }
    this.setDefaultContext()
  }

  handleLinkButtonClick = () => {
    if (this.marks.link) this.handleLinkToggle()
    else this.setLinkContext()
  }

  render() {
    return (
      <Toolbar isDraggable={this.props.isDraggable}>
        <Toolbar.Context
          className="default"
          isActive={this.state.context === 'default'}>
          <Toolbar.Left>
            <ToolGroup>
              <EditorButton
                icon="IconB"
                isActive={this.marks.bold}
                title="editor.commands.bold"
                onMouseDown={this.handleCommand('bold')}/>
              <EditorButton
                icon="IconI"
                isActive={this.marks.italic}
                title="editor.commands.italic"
                onMouseDown={this.handleCommand('italic')}/>
              <EditorButton
                icon="IconU"
                isActive={this.marks.underline}
                title="editor.commands.underline"
                onMouseDown={this.handleCommand('underline')}/>
              <EditorButton
                icon="IconO"
                isActive={this.marks.overline}
                title="editor.commands.overline"
                onMouseDown={this.handleCommand('overline')}/>
              <EditorButton
                icon="IconS"
                isActive={this.marks.strikethrough}
                title="editor.commands.strikethrough"
                onMouseDown={this.handleCommand('strikethrough')}/>
              <EditorButton
                icon={'IconQ'}
                title="editor.commands.blockquote"
                onMouseDown={this.handleCommand('blockquote')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                icon="IconSup"
                isActive={this.marks.superscript}
                title="editor.commands.superscript"
                onMouseDown={this.handleCommand('superscript')}/>
              <EditorButton
                icon="IconSub"
                isActive={this.marks.subscript}
                title="editor.commands.subscript"
                onMouseDown={this.handleCommand('subscript')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                icon="IconAlignLeft"
                isActive={this.align.left}
                title="editor.commands.left"
                onMouseDown={this.handleCommand('left')}/>
              <EditorButton
                icon="IconAlignCenter"
                isActive={this.align.center}
                title="editor.commands.center"
                onMouseDown={this.handleCommand('center')}/>
              <EditorButton
                icon="IconAlignRight"
                isActive={this.align.right}
                title="editor.commands.right"
                onMouseDown={this.handleCommand('right')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                icon="IconBulletList"
                title="editor.commands.ul"
                onMouseDown={this.handleCommand('ul')}/>
              <EditorButton
                icon="IconNumberedList"
                title="editor.commands.ol"
                onMouseDown={this.handleCommand('ol')}/>
              <EditorButton
                icon="IconSink"
                title="editor.commands.sinkListItem"
                onMouseDown={this.handleCommand('sinkListItem')}/>
              <EditorButton
                noFocus
                icon="IconLift"
                title="editor.commands.liftListItem"
                onMouseDown={this.handleCommand('liftListItem')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                isActive={this.marks.link}
                title="editor.commands.link.button"
                icon="IconLink"
                onMouseDown={this.handleLinkButtonClick}/>
            </ToolGroup>
          </Toolbar.Left>
        </Toolbar.Context>
        <LinkContext
          isActive={this.state.context === 'link'}
          onCancel={this.setDefaultContext}
          onCommit={this.handleLinkToggle}/>
      </Toolbar>
    )
  }

  static propTypes = {
    isDraggable: bool,
    state: instanceOf(EditorState),
    onCommand: func.isRequired
  }
}


const EditorButton = ({ icon, ...props }) => {
  let Icon = icons[icon]
  return <Button {...props} noFocus icon={<Icon/>}/>
}

EditorButton.propTypes = {
  icon: string.isRequired
}


function isMarkActive(type, state) {
  let { from, $from, to, empty } = state.selection
  return (empty) ?
    !!type.isInSet(state.storedMarks || $from.marks()) :
    state.doc.rangeHasMark(from, to, type)
}

module.exports = {
  EditorToolbar
}
