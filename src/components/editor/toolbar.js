'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { func, instanceOf } = PropTypes
const { Toolbar, ToolbarContext, ToolGroup } = require('../toolbar')
const { IconButton } = require('../button')
const { EditorState } = require('prosemirror-state')
const { LinkToolbar, LinkButton } = require('./link')


const {
  IconB,
  IconI,
  IconU,
  IconS,
  IconQ,
  IconSup,
  IconSub,
  //  IconAlignLeft,
  //  IconAlignCenter,
  //  IconAlignRight,
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
      'sinkListItem',
    ]) {
      this[action] = () => this.props.onCommand(action)
    }

    this.state = {
      marks: this.getActiveMarks(props.state),
      isLinkActive: false,
    }
  }

  componentWillReceiveProps(props) {
    if (props.state !== this.props.state) {
      this.setState({
        marks: this.getActiveMarks(props.state)
      })
    }
  }

  getActiveMarks(state = this.props.state) {
    let res = {}, mark

    for (mark in state.schema.marks) {
      res[mark] = this.isMarkActive(state.schema.marks[mark], state)
    }

    return res
  }

  isMarkActive(type, state = this.props.state) {
    const { from, $from, to, empty } = state.selection

    return (empty) ?
           !!type.isInSet(state.storedMarks || $from.marks()) :
           state.doc.rangeHasMark(from, to, type)
  }

  renderMarkButton(name, icon) {
    return (
      <IconButton
        canHaveFocus={false}
        icon={icon}
        isActive={this.state.marks[name]}
        title={`editor.commands.${name}`}
        onMouseDown={this[name]}/>
    )
  }

  turnLinkToolbar = isLinkActive => {
    return () => this.setState({ isLinkActive })
  }

  toggleLink = target => {
    console.log('toggle')
    this.props.onCommand('link', {
      href: target,
      title: target,
    })
  }

  render() {
    return (
      <Toolbar isDraggable={false}>
        <ToolbarContext isActive={!this.state.isLinkActive}>
          <div className="toolbar-left">
            <ToolGroup>
              {this.renderMarkButton('bold', <IconB/>)}
              {this.renderMarkButton('italic', <IconI/>)}
              {this.renderMarkButton('underline', <IconU/>)}
              {this.renderMarkButton('strikethrough', <IconS/>)}
              <IconButton
                canHaveFocus={false}
                icon={<IconQ/>}
                title="editor.commands.blockquote"
                onMouseDown={this.blockquote}/>
            </ToolGroup>
            <ToolGroup>
              {this.renderMarkButton('superscript', <IconSup/>)}
              {this.renderMarkButton('subscript', <IconSub/>)}
            </ToolGroup>
            {/*<ToolGroup>
              <IconButton
                isDisabled
                canHaveFocus={false}
                icon={<IconAlignLeft/>}
                isActive={false}
                title="editor.commands.left"
                onMouseDown={this.left}/>
              <IconButton
                isDisabled
                canHaveFocus={false}
                icon={<IconAlignCenter/>}
                isActive={false}
                title="editor.commands.center"
                onMouseDown={this.center}/>
              <IconButton
                isDisabled
                canHaveFocus={false}
                icon={<IconAlignRight/>}
                isActive={false}
                title="editor.commands.right"
                onMouseDown={this.right}/>
            </ToolGroup>*/}
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
                icon={<IconSink/>}
                onMouseDown={this.sinkListItem}/>
              <IconButton
                canHaveFocus={false}
                icon={<IconLift/>}
                onMouseDown={this.liftListItem}/>
            </ToolGroup>
            <ToolGroup>
              <LinkButton
                state={this.props.state}
                mark={this.state.marks.link}
                callback={this.turnLinkToolbar(true)}
                action={this.toggleLink} />
            </ToolGroup>
          </div>
        </ToolbarContext>
        <LinkToolbar
          isActive={this.state.isLinkActive}
          onCommit={this.turnLinkToolbar(false)}
          action={this.toggleLink} />
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
