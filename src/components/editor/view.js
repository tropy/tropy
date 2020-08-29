import { shell } from 'electron'
import React from 'react'
import { func, bool, instanceOf, number } from 'prop-types'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { isMeta } from '../../keymap'
import { isLink } from '../../dom'
import throttle from 'lodash.throttle'


class ProseMirror extends React.Component {
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
    const { state, isDisabled, isReadOnly, tabIndex } = props
    const wasDisabled = this.props.isDisabled
    const wasReadOnly = this.props.isReadOnly

    if (
      isDisabled !== wasDisabled ||
      isReadOnly !== wasReadOnly ||
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

  getEditorProps({ isDisabled, isReadOnly, tabIndex } = this.props) {
    return {
      editable: () => !isDisabled && !isReadOnly,
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

  handleResize = throttle((rect) => {
    this.resize(rect)
  }, 50)

  resize = ({ width, height }) => {
    this.props.onResize({ width, height })
  }

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
    isReadOnly: bool,
    state: instanceOf(EditorState),
    tabIndex: number.isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onFocus: func.isRequired,
    onKeyDown: func.isRequired,
    onResize: func.isRequired
  }
}

export {
  ProseMirror as EditorView
}
