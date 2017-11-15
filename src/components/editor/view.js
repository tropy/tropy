'use strict'

const { shell } = require('electron')
const React = require('react')
const { Component } = React
const { func, bool, instanceOf, number } = require('prop-types')
const { EditorView } = require('prosemirror-view')
const { EditorState } = require('prosemirror-state')


class ProseMirror extends Component {
  componentDidMount() {
    this.pm = new EditorView(this.container, {
      state: this.props.state,
      ...this.getEditorProps(),
      dispatchTransaction: this.handleChange,
      handleKeyDown: this.handleKeyDown,
      handleClickOn: this.handleClickOn,
      handleDOMEvents: {
        focus: this.handleFocus,
        blur: this.handleBlur
      }
    })
  }

  componentWillUnmount() {
    this.pm.destroy()
  }

  shouldComponentUpdate(props) {
    const { state, isDisabled, tabIndex } = props
    const wasDisabled = this.props.isDisabled

    if (
      isDisabled !== wasDisabled ||
      tabIndex !== this.props.tabIndex
    ) {
      this.pm.setProps(this.getEditorProps(props))
    }

    if (!isDisabled && state !== this.pm.state) {
      this.pm.updateState(props.state)
    }

    return false
  }

  getEditorProps(props = this.props) {
    const { isDisabled, tabIndex } = props

    return {
      editable: () => !isDisabled,
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

  handleClickOn = (view, pos, node, nodePos, event, direct) => {
    if (direct && event.altKey) {
      const targetNode = node.nodeAt(pos - nodePos - 1)
      let href
      for (let mark of targetNode.marks) {
        href = mark.attrs && mark.attrs.href
        if (href) break
      }
      href && shell.openExternal(href)
    }
  }

  handleFocus = (...args) => {
    this.props.onFocus(...args)
  }

  handleBlur = (...args) => {
    getSelection().removeAllRanges()
    this.props.onBlur(...args)
  }

  render() {
    return (
      <div ref={this.setContainer} className="prose-mirror-container"/>
    )
  }

  static propTypes = {
    isDisabled: bool,
    state: instanceOf(EditorState),
    tabIndex: number.isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onFocus: func.isRequired,
    onKeyDown: func.isRequired
  }
}

module.exports = {
  EditorView: ProseMirror
}
