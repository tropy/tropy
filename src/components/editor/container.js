import React from 'react'
import cx from 'classnames'
import { func, bool, object, number, string } from 'prop-types'
import { EditorState } from 'prosemirror-state'
import { EditorToolbar } from './toolbar.js'
import { ProseMirror as EditorView } from './prosemirror.js'
import { Placeholder } from '../placeholder.js'
import { createCommands, createPlugins, schema } from '../../editor/index.js'
import { match } from '../../keymap.js'
import { noop } from '../../common/util.js'

const commands = createCommands(schema)
const plugins = createPlugins(schema)

export class Editor extends React.Component {
  toolbar = React.createRef()
  container = React.createRef()
  view = React.createRef()

  state = {
    hasViewFocus: false
  }

  get classes() {
    return ['editor', {
      'is-blurred': !this.state.hasViewFocus
    }]
  }

  getEditorState({ state } = this.props) {
    if (state == null) {
      return EditorState.create({ schema, plugins })
    }

    if (state instanceof EditorState) {
      return state
    }

    return EditorState.fromJSON({ schema, plugins }, state)
  }

  isBlank(doc) {
    if (doc.childCount !== 1) return false
    if (!doc.firstChild.isTextblock) return false
    if (doc.firstChild.content.size !== 0) return false
    return true
  }

  focus = () => {
    this.view.current?.dom.focus()
  }

  exec(action, ...args) {
    return (commands[action] || noop)(
      this.view.current.state, this.view.current.dispatch, ...args
    )
  }

  handleKeyDown = (_, event) => {
    if (this.props.isDisabled)
      return false

    const action = match(this.props.keymap, event)

    switch (action) {
      case null:
        return
      case 'addLink':
        if (this.toolbar.current) {
          this.toolbar.current.handleLinkButtonClick()
        }
        break
      case 'lift':
        if (this.exec('liftListItem')) break
        // eslint-disable-next-line no-fallthrough
      default:
        if (!this.exec(action)) return
    }

    event.stopPropagation()
    return true
  }

  handleFocus = (event) => {
    if (event.target === this.container.current) {
      setTimeout(this.focus, 0)
    }
  }

  handleCommand = (...args) => {
    if (this.exec(...args)) {
      if (!this.state.hasViewFocus) this.focus()
    }
  }

  handleViewFocus = () => {
    this.setState({ hasViewFocus: true })
  }

  handleViewBlur = () => {
    this.setState({ hasViewFocus: false })
    this.props.onBlur()
  }

  render() {
    let { placeholder } = this.props
    let state = this.getEditorState()

    let isReadOnly = this.props.isReadOnly || !this.state.hasViewFocus

    let hasPlaceholder = !(
      this.props.isDisabled || this.props.isReadOnly || placeholder == null
    )

    return (
      <div
        ref={this.container}
        className={cx(this.classes)}
        tabIndex={-1}
        onFocus={this.handleFocus}>
        <EditorToolbar
          isDisabled={this.props.isDisabled}
          isReadOnly={this.props.isReadOnly}
          isTitlebar={this.props.hasTitlebar}
          state={state}
          ref={this.toolbar}
          onCommand={this.handleCommand}/>
        <div className="scroll-container">
          {(hasPlaceholder && this.isBlank(state.doc)) &&
            <Placeholder id={placeholder}/>}
          <EditorView
            ref={this.view}
            state={state}
            isDisabled={this.props.isDisabled}
            isReadOnly={isReadOnly}
            tabIndex={this.props.tabIndex}
            onFocus={this.handleViewFocus}
            onBlur={this.handleViewBlur}
            onChange={this.props.onChange}
            onKeyDown={this.handleKeyDown}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    hasTitlebar: bool,
    isDisabled: bool,
    isReadOnly: bool,
    keymap: object.isRequired,
    mode: string.isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    placeholder: string,
    state: object,
    tabIndex: number.isRequired
  }

  static defaultProps = {
    mode: 'horizontal',
    tabIndex: -1
  }
}
