import React from 'react'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar'
import { Button } from '../button'
import { LinkContext } from './link'
import { bool, func, object, string } from 'prop-types'
import * as icons from '../icons'


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

  handleCommand(cmd) {
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

  render() {
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
                isDisabled={isDisabled}
                title="editor.commands.link.button"
                icon="IconLink"
                onMouseDown={this.handleLinkButtonClick}/>
              <EditorButton
                isDisabled={!marks.link || isDisabled}
                title="editor.commands.unlink"
                icon="IconRemoveLink"
                onMouseDown={this.handleUnlinkButtonClick}/>
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
    align: object.isRequired,
    isDisabled: bool,
    isReadOnly: bool,
    isTitlebar: bool,
    link: object,
    marks: object.isRequired,
    onCommand: func.isRequired
  }

  static defaultProps = {
    align: {},
    marks: {}
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
