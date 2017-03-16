'use strict'

const React = require('react')
const shallow = require('react/lib/shallowCompare')
const { Component, PropTypes } = React
const { func, bool, object, number } = PropTypes

const { EditorState } = require('prosemirror-state')
const { EditorView } = require('prosemirror-view')

const { EditorToolbar } = require('./toolbar')

const { schema } = require('./schema')
const plugins = require('./plugins')(schema)
const commands = require('./commands')(schema)

const { noop } = require('../../common/util')
const { match } = require('../../keymap')


class Editor extends Component {
  componentDidMount() {
    this.view = new EditorView(this.container, {
      state: EditorState.create({
        schema,
        plugins
      }),
      ...this.getEditorProps()
    })
  }

  componentWillUnmount() {
    this.view.destroy()
    delete this.view
  }

  shouldComponentUpdate(props) {
    if (shallow(this, props)) {
      this.update(props)
    }

    return false
  }

  getEditorProps(props = this.props) {
    const { isDisabled, tabIndex } = props

    return {
      editable: () => !isDisabled,
      attributes: {
        tabIndex: isDisabled ? -1 : tabIndex
      },

      handleKeyDown: isDisabled ? noop : this.handleKeyDown
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  handleKeyDown = (view, event) => {
    const action = match(this.props.keymap, event)

    if (commands[action]) {
      return commands[action](view.state, view.dispatch, view)
    }

    return false
  }

  focus = () => {
    this.view.dom.focus()
  }

  update(props = this.props) {
    this.view.setProps(this.getEditorProps(props))
  }

  render() {
    return (
      <div className="editor" onClick={this.focus}>
        <EditorToolbar
          hasMarkTools
          hasListTools
          hasLinkTools />

        <div className="scroll-container">
          <div ref={this.setContainer} className="prose-mirror-container"/>
        </div>
      </div>
    )
  }

  static propTypes = {
    isDisabled: bool,
    keymap: object.isRequired,
    value: object,
    onChange: func,
    tabIndex: number
  }

  static defaultProps = {
    tabIndex: -1
  }
}

module.exports = {
  Editor
}
