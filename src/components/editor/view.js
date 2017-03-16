'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { func, bool, object, number } = PropTypes

const { EditorView } = require('prosemirror-view')
const { EditorState } = require('prosemirror-state')

const { schema } = require('./schema')
const commands = require('./commands')(schema)
const plugins = require('./plugins')(schema)

const { match } = require('../../keymap')
const { noop } = require('../../common/util')


class ProseMirrorContainer extends Component {
  componentDidMount() {

    this.pm = new EditorView(this.container, {
      state: EditorState.create({
        schema, plugins, doc: this.props.doc
      }),

      ...this.getEditorProps(),

      dispatchTransaction: this.handleChange,
      handleKeyDown: this.handleKeyDown
    })
  }

  componentWillUnmount() {
    this.pm.destroy()
  }

  shouldComponentUpdate(props) {
    if (
      props.isDisabled !== this.props.isDisabled ||
      props.tabIndex !== this.props.tabIndex
    ) {
      this.update(props)
    }

    // if (props.doc !== this.doc) {
    //   this.replace(props)
    // }

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

  get doc() {
    return this.pm.state.doc
  }

  get text() {
    return this.pm.dom.innerText.replace(/\s\s+/g, ' ')
  }

  get html() {
    return this.pm.dom.innerHtml
  }


  setContainer = (container) => {
    this.container = container
  }

  focus = () => {
    this.pm.focus()
  }

  handleChange = (tr) => {
    this.pm.updateState(this.pm.state.apply(tr))
    this.props.onChange(this)
  }

  handleKeyDown = (view, event) => {
    const { isDisabled, keymap } = this.props

    if (!isDisabled) {
      const action = match(keymap, event)

      if (commands[action]) {
        return commands[action](view.state, view.dispatch, view)
      }
    }

    return false
  }


  update(props = this.props) {
    this.pm.setProps(this.getEditorProps(props))
  }

  replace(props = this.props) {
    this.pm.updateState(EditorState.create({
      schema: this.pm.state.schema,
      plugins: this.pm.state.plugins,
      doc: props.doc
    }))
  }

  render() {
    return (
      <div ref={this.setContainer} className="prose-mirror-container"/>
    )
  }

  static propTypes = {
    doc: object,
    isDisabled: bool,
    keymap: object.isRequired,
    tabIndex: number.isRequired,
    onChange: func.isRequired
  }
}

module.exports = {
  EditorView: ProseMirrorContainer
}
