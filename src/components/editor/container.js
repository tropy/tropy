'use strict'

const React = require('react')
const { func, bool, object, number, string } = require('prop-types')
const { EditorToolbar } = require('./toolbar')
const { EditorState } = require('prosemirror-state')
const { EditorView } = require('./view')
const { Placeholder } = require('../placeholder')
const { createCommands, createPlugins, schema } = require('../../editor')
const { match } = require('../../keymap')
const cx = require('classnames')
const { get, noop, restrict } = require('../../common/util')
const { SASS: { EDITOR } } = require('../../constants')

const commands = createCommands(schema)
const plugins = createPlugins(schema)

class Editor extends React.Component {
  toolbar = React.createRef()
  container = React.createRef()

  state = {
    hasViewFocus: false
  }

  setView = (view) => {
    this.view = get(view, ['pm'])
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
    if (this.view != null) this.view.dom.focus()
  }

  exec(action, ...args) {
    return (commands[action] || noop)(
      this.view.state, this.view.dispatch, ...args
    )
  }

  handleChange = (tr) => {
    this.props.onChange(this.view.state.apply(tr), tr.docChanged)
  }

  handleKeyDown = (_, event) => {
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

  handleResize = ({ width, height }) => {
    const dim = (this.props.mode !== 'horizontal') ? width : height
    this.container.current.style.setProperty(
      '--editor-padding',
      `${restrict(Math.round(dim / 10), 0, EDITOR.MAX_PADDING)}px`
    )
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
            ref={this.setView}
            state={state}
            isDisabled={this.props.isDisabled}
            isReadOnly={isReadOnly}
            tabIndex={this.props.tabIndex}
            onFocus={this.handleViewFocus}
            onBlur={this.handleViewBlur}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            onResize={this.handleResize}/>
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

module.exports = {
  Editor
}
