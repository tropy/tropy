import React from 'react'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar.js'
import { MaximizeButton } from '../settings/maximize.js'
import { Button } from '../button.js'
import { LinkContext } from './link.js'

export class EditorToolbar extends React.PureComponent {
  state = {
    context: 'default'
  }

  setDefaultContext = () => {
    this.setState({ context: 'default' })
  }

  setLinkContext = () => {
    this.setState({ context: 'link' })
  }

  handleCommand (cmd) {
    return () => this.props.onCommand(cmd)
  }

  handleLinkCommit = (attrs) => {
    this.props.onCommand('insertLink', attrs)
    this.setDefaultContext()
  }

  handleLinkButtonClick = () => {
    this.setLinkContext()
  }

  handleUnlinkButtonClick = () => {
    this.props.onCommand('removeLink')
  }

  render () {
    let T = this.props.isTitlebar ? Titlebar : Toolbar
    let isDisabled = this.props.isDisabled || this.props.isReadOnly

    let { align, marks, link } = this.props
    let { context } = this.state

    return (
      <T>
        <Toolbar.Context
          className="default"
          isActive={context === 'default'}>
          <Toolbar.Left>
            <ToolGroup>
              <EditorButton
                icon="B"
                isActive={marks.bold}
                isDisabled={isDisabled}
                title="editor.commands.bold"
                onMouseDown={this.handleCommand('bold')}/>
              <EditorButton
                icon="I"
                isActive={marks.italic}
                isDisabled={isDisabled}
                title="editor.commands.italic"
                onMouseDown={this.handleCommand('italic')}/>
              <EditorButton
                icon="U"
                isActive={marks.underline}
                isDisabled={isDisabled}
                title="editor.commands.underline"
                onMouseDown={this.handleCommand('underline')}/>
              <EditorButton
                icon="O"
                isActive={marks.overline}
                isDisabled={isDisabled}
                title="editor.commands.overline"
                onMouseDown={this.handleCommand('overline')}/>
              <EditorButton
                icon="S"
                isActive={marks.strikethrough}
                isDisabled={isDisabled}
                title="editor.commands.strikethrough"
                onMouseDown={this.handleCommand('strikethrough')}/>
              <EditorButton
                icon="Q"
                isDisabled={isDisabled}
                title="editor.commands.blockquote"
                onMouseDown={this.handleCommand('blockquote')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                icon="Sup"
                isActive={marks.superscript}
                isDisabled={isDisabled}
                title="editor.commands.superscript"
                onMouseDown={this.handleCommand('superscript')}/>
              <EditorButton
                icon="Sub"
                isActive={marks.subscript}
                isDisabled={isDisabled}
                title="editor.commands.subscript"
                onMouseDown={this.handleCommand('subscript')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                icon="AlignLeft"
                isActive={align.left}
                isDisabled={isDisabled}
                title="editor.commands.left"
                onMouseDown={this.handleCommand('left')}/>
              <EditorButton
                icon="AlignCenter"
                isActive={align.center}
                isDisabled={isDisabled}
                title="editor.commands.center"
                onMouseDown={this.handleCommand('center')}/>
              <EditorButton
                icon="AlignRight"
                isActive={align.right}
                isDisabled={isDisabled}
                title="editor.commands.right"
                onMouseDown={this.handleCommand('right')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                icon="BulletList"
                isDisabled={isDisabled}
                title="editor.commands.ul"
                onMouseDown={this.handleCommand('ul')}/>
              <EditorButton
                icon="NumberedList"
                isDisabled={isDisabled}
                title="editor.commands.ol"
                onMouseDown={this.handleCommand('ol')}/>
              <EditorButton
                icon="Sink"
                isDisabled={isDisabled}
                title="editor.commands.sinkListItem"
                onMouseDown={this.handleCommand('sinkListItem')}/>
              <EditorButton
                noFocus
                icon="Lift"
                isDisabled={isDisabled}
                title="editor.commands.liftListItem"
                onMouseDown={this.handleCommand('liftListItem')}/>
            </ToolGroup>
            <ToolGroup>
              <EditorButton
                isDisabled={isDisabled}
                title="editor.commands.link.button"
                icon="Link"
                onMouseDown={this.handleLinkButtonClick}/>
              <EditorButton
                isDisabled={!marks.link || isDisabled}
                title="editor.commands.unlink"
                icon="RemoveLink"
                onMouseDown={this.handleUnlinkButtonClick}/>
            </ToolGroup>
          </Toolbar.Left>
          <Toolbar.Right>
            <ToolGroup>
              <MaximizeButton
                isDisabled={this.props.isDisabled}
                name="notepad"/>
            </ToolGroup>
          </Toolbar.Right>
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

  static defaultProps = {
    align: {},
    marks: {}
  }
}

const EditorButton = (props) => (
  <Button {...props} noFocus/>
)
