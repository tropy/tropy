'use strict'

const React = require('react')
const shallow = require('react/lib/shallowCompare')
const { Component, PropTypes } = React
const { func, bool, object, number } = PropTypes

const { EditorState } = require('prosemirror-state')
const { EditorView } = require('prosemirror-view')

const { plugins } = require('./plugins')
const { commands } = require('./commands')
const { match } = require('../../keymap')


class Editor extends Component {
  componentDidMount() {
    this.view = new EditorView(this.container, {
      state: EditorState.create({
        schema: this.props.schema,
        plugins
      }),
      handleKeyDown: this.handleKeyDown,
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
    return {
      editable: () => !props.isDisabled,
      attributes: {
        tabIndex: props.tabIndex
      }
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

  update(props = this.props) {
    this.view.setProps(this.getEditorProps(props))
  }

  render() {
    return (
      <div ref={this.setContainer} className="editor"/>
    )
  }

  static propTypes = {
    isDisabled: bool,
    keymap: object.isRequired,
    value: object,
    schema: object.isRequired,
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
