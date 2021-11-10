import React from 'react'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar'
import { Button } from '../button'
import { EditorState } from 'prosemirror-state'
import { LinkContext } from './link'
import memoize from 'memoize-one'
import { bool, func, instanceOf, string } from 'prop-types'
import * as icons from '../icons'


export class EditorToolbar extends React.PureComponent {
  state = {
    context: 'default'
  }

  get align() {
    return this.getActiveAlignment(this.props.state)
  }

  get marks() {
    return this.getActiveMarks(this.props.state)
  }

  get link() {
    return this.getActiveLink(this.props.state)
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

  getActiveLink = memoize(state => {
    let cursor = state.selection.$cursor

    if (cursor) {
      for (let mark of cursor.marks()) {
        if (mark.type === state.schema.marks.link)
          return mark.attrs
      }
    }

    return null
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

  handleLinkCommit = (attrs) => {
    let { link } = this

    if (link == null) {
      this.props.onCommand('insertLink', attrs)
    } else {
      if (!attrs.href)
        this.props.onCommand('removeLink')
      else if (link.href !== attrs.href)
        this.props.onCommand('updateLink', attrs)
    }

    this.setDefaultContext()
  }

  handleLinkButtonClick = () => {
    if (this.marks.link)
      this.props.onCommand('removeLink')
    else
      this.setLinkContext()
  }

  render() {
    let T = this.props.isTitlebar ? Titlebar : Toolbar
    let isDisabled = this.props.isDisabled || this.props.isReadOnly

    let { align, marks, link } = this
    let { context } = this.state

    if (link != null)
      context = 'link'

    return (
      <T>
        <Toolbar.Context
          className="default"
          isActive={context === 'default'}>
          <Toolbar.Left>
            <ToolGroup>
              <EditorButton
                icon="IconB"
                isActive={marks.bold}
                isDisabled={isDisabled}
                title="editor.commands.bold"
                onMouseDown={this.handleCommand('bold')}/>
              <EditorButton
                icon="IconI"
                isActive={marks.italic}
                isDisabled={isDisabled}
                title="editor.commands.italic"
                onMouseDown={this.handleCommand('italic')}/>
              <EditorButton
                icon="IconU"
                isActive={marks.underline}
                isDisabled={isDisabled}
                title="editor.commands.underline"
                onMouseDown={this.handleCommand('underline')}/>
              <EditorButton
                icon="IconO"
                isActive={marks.overline}
                isDisabled={isDisabled}
                title="editor.commands.overline"
                onMouseDown={this.handleCommand('overline')}/>
              <EditorButton
                icon="IconS"
                isActive={marks.strikethrough}
                isDisabled={isDisabled}
                title="editor.commands.strikethrough"
                onMouseDown={this.handleCommand('strikethrough')}/>
              <EditorButton
                icon={'IconQ'}
                isDisabled={isDisabled}
                title="editor.commands.blockquote"
                onMouseDown={this.handleCommand('blockquote')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                icon="IconSup"
                isActive={marks.superscript}
                isDisabled={isDisabled}
                title="editor.commands.superscript"
                onMouseDown={this.handleCommand('superscript')}/>
              <EditorButton
                icon="IconSub"
                isActive={marks.subscript}
                isDisabled={isDisabled}
                title="editor.commands.subscript"
                onMouseDown={this.handleCommand('subscript')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                icon="IconAlignLeft"
                isActive={align.left}
                isDisabled={isDisabled}
                title="editor.commands.left"
                onMouseDown={this.handleCommand('left')}/>
              <EditorButton
                icon="IconAlignCenter"
                isActive={align.center}
                isDisabled={isDisabled}
                title="editor.commands.center"
                onMouseDown={this.handleCommand('center')}/>
              <EditorButton
                icon="IconAlignRight"
                isActive={align.right}
                isDisabled={isDisabled}
                title="editor.commands.right"
                onMouseDown={this.handleCommand('right')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                icon="IconBulletList"
                isDisabled={isDisabled}
                title="editor.commands.ul"
                onMouseDown={this.handleCommand('ul')}/>
              <EditorButton
                icon="IconNumberedList"
                isDisabled={isDisabled}
                title="editor.commands.ol"
                onMouseDown={this.handleCommand('ol')}/>
              <EditorButton
                icon="IconSink"
                isDisabled={isDisabled}
                title="editor.commands.sinkListItem"
                onMouseDown={this.handleCommand('sinkListItem')}/>
              <EditorButton
                noFocus
                icon="IconLift"
                isDisabled={isDisabled}
                title="editor.commands.liftListItem"
                onMouseDown={this.handleCommand('liftListItem')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                isActive={marks.link}
                isDisabled={isDisabled}
                title="editor.commands.link.button"
                icon="IconLink"
                onMouseDown={this.handleLinkButtonClick}/>
            </ToolGroup>
          </Toolbar.Left>
        </Toolbar.Context>
        <LinkContext
          href={link?.href}
          isActive={context === 'link'}
          isReadOnly={this.props.isReadOnly}
          onCancel={this.setDefaultContext}
          onCommit={this.handleLinkCommit}/>
      </T>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isReadOnly: bool,
    isTitlebar: bool,
    state: instanceOf(EditorState),
    onCommand: func.isRequired
  }
}


const EditorButton = ({ icon, ...props }) => {
  let Icon = icons[icon]

  return (
    <Button {...props} noFocus icon={<Icon/>}/>
  )
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
