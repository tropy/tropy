'use strict'

const { shell } = require('electron')
const React = require('react')
const { Component } = React
const { func, bool, instanceOf, number } = require('prop-types')
const { EditorView } = require('prosemirror-view')
const { EditorState } = require('prosemirror-state')
const { isMeta } = require('../../keymap')
const { isLink } = require('../../dom')
const { darwin } = require('../../common/os')
const throttle = require('lodash.throttle')


class ProseMirror extends Component {
  componentDidMount() {
    this.pm = new EditorView(this.container, {
      state: this.props.state,
      ...this.getEditorProps(),
      dispatchTransaction: this.handleChange,
      handleKeyDown: this.handleKeyDown,
      handleClick: this.handleViewClick,
      handleDOMEvents: {
        focus: this.handleFocus,
        blur: this.handleBlur
      }
    })

    this.ro = new ResizeObserver(([e]) => {
      this.handleResize(e.contentRect)
    })
    this.ro.observe(this.container)
  }

  componentWillUnmount() {
    this.ro.disconnect()
    this.pm.destroy()
  }

  shouldComponentUpdate(props) {
    const { state, isDisabled, isEditable, tabIndex } = props
    const wasDisabled = this.props.isDisabled
    const wasEditable = this.props.isEditable

    if (
      isDisabled !== wasDisabled ||
      isEditable !== wasEditable ||
      tabIndex !== this.props.tabIndex
    ) {
      this.pm.setProps(this.getEditorProps(props))
    }

    if (state != null && state !== this.pm.state) {
      this.pm.updateState(state)
    }

    return false
  }

  get bounds() {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    }
  }

  getEditorProps(props = this.props) {
    const { isDisabled, isEditable, tabIndex } = props

    return {
      editable: () => !isDisabled && isEditable,
      attributes: {
        tabIndex: isDisabled ? -1 : tabIndex
      }
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  handleChange = (...args) => {
    this.props.onChange(...args)
  }

  handleKeyDown = (...args) => {
    return (this.props.isDisabled) ? false : this.props.onKeyDown(...args)
  }

  handleViewClick = (view, pos, event) => {
    if (!view.editable) this.pm.dom.focus()
    return isMeta(event) // disable PM's block select
  }

  handleContainerClick = (event) => {
    const meta = isMeta(event)
    const { target } = event

    if (target != null && isLink(target)) {
      event.preventDefault()
      if (meta) shell.openExternal(target.href)
    }
  }

  handleFocus = (...args) => {
    this.props.onFocus(...args)
  }

  handleBlur = (...args) => {
    this.props.onBlur(...args)
  }

  handleResize = (darwin || devicePixelRatio === 1) ?
    (rect) => this.resize(rect) :
    () => this.resize(this.bounds)

  resize = throttle(({ width, height }) => {
    this.props.onResize({ width, height })
  }, 50)

  render() {
    return (
      <div
        ref={this.setContainer}
        className="prose-mirror-container"
        onClick={this.handleContainerClick}/>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isEditable: bool.isRequired,
    state: instanceOf(EditorState),
    tabIndex: number.isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onFocus: func.isRequired,
    onKeyDown: func.isRequired,
    onResize: func.isRequired
  }
}

module.exports = {
  EditorView: ProseMirror
}
