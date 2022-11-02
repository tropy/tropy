import React from 'react'
import cx from 'classnames'
import { func, bool, object, number, string } from 'prop-types'
import { EditorToolbar } from './toolbar.js'
import { ProseMirror as EditorView } from './prosemirror.js'
import { Placeholder } from '../placeholder.js'
import { commands, isBlank, toEditorState } from '../../editor/index.js'
import { match } from '../../keymap.js'


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

  focus = () => {
    this.view.current?.dom.focus()
  }

  exec(action, ...args) {
    return commands[action]?.(
      this.view.current.state, this.view.current.dispatch, ...args
    )
  }

  handleContextMenu = (_, event) => {
    this.props.onContextMenu?.(event)
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
      this.focus()
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
    let state = toEditorState(this.props.state)

    let hasPlaceholder = !(
      this.props.isDisabled || this.props.isReadOnly || placeholder == null
    )

    return (
      <div
        ref={this.container}
        className={cx(this.classes)}
        tabIndex={this.props.tabIndex}
        onContextMenu={this.props.onContextMenu}
        onFocus={this.handleFocus}>
        <EditorToolbar
          isDisabled={this.props.isDisabled}
          isReadOnly={this.props.isReadOnly}
          isTitlebar={this.props.hasTitlebar}
          state={state}
          ref={this.toolbar}
          onCommand={this.handleCommand}/>
        {(hasPlaceholder && isBlank(state.doc)) &&
          <Placeholder id={placeholder}/>}
        <EditorView
          ref={this.view}
          state={state}
          isDisabled={this.props.isDisabled}
          isReadOnly={this.props.isReadOnly}
          onFocus={this.handleViewFocus}
          onBlur={this.handleViewBlur}
          onChange={this.props.onChange}
          onContextMenu={this.handleContextMenu}
          onKeyDown={this.handleKeyDown}/>
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
    onContextMenu: func,
    placeholder: string,
    state: object,
    tabIndex: number.isRequired
  }

  static defaultProps = {
    mode: 'horizontal',
    tabIndex: -1
  }
}
