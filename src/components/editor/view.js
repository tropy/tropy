'use strict'

const { shell } = require('electron')
const React = require('react')
const { Component } = React
const { func, bool, instanceOf, number } = require('prop-types')
const { EditorView } = require('prosemirror-view')
const { EditorState } = require('prosemirror-state')
const { darwin } = require('../../common/os')


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

  handleClickOn = (view, pos, node, nodePos, event, direct) => {
    // open a link in system browser with cmd-click on mac or ctrl-click elsewhere
    const modifier = darwin ? 'metaKey' : 'ctrlKey'
    if (!direct || !event[modifier]) return
    const targetNode = node.nodeAt(pos - nodePos - 1)
    if (!targetNode) return
    for (let mark of targetNode.marks) {
      const href = mark.attrs && mark.attrs.href
      if (href) {
        return shell.openExternal(href)
      }
    }
  }

  handleFocus = (...args) => {
    this.props.onFocus(...args)
  }

  handleBlur = (...args) => {
    this.props.onBlur(...args)
  }

  render() {
    return (
      <div ref={this.setContainer} className="prose-mirror-container"/>
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
    onKeyDown: func.isRequired
  }
}

module.exports = {
  EditorView: ProseMirror
}
