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


class ProseMirror extends Component {
  static displayName = 'EditorView'

  componentDidMount() {
    this.pm = new EditorView(this.container, {
      state: EditorState.create({
        schema, plugins, doc: this.props.doc
      }),

      ...this.getEditorProps(),

      dispatchTransaction: this.handleChange,
      handleKeyDown: this.handleKeyDown,
      onFocus: this.handleFocus,
      onBlur: this.handleBlur
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

  isMarkActive(type) {
    const { from, $from, to, empty } = this.pm.state.selection

    return (empty) ?
      !!type.isInSet(this.pm.state.storedMarks || $from.marks()) :
      this.doc.rangeHasMark(from, to, type)
  }

  get isBoldActive() {
    return this.isMarkActive(schema.marks.strong)
  }

  get isItalicActive() {
    return this.isMarkActive(schema.marks.em)
  }

  get isUnderlineActive() {
    return this.isMarkActive(schema.marks.underline)
  }

  get isStrikeThroughActive() {
    return this.isMarkActive(schema.marks.strikethrough)
  }

  get isSubScriptActive() {
    return this.isMarkActive(schema.marks.subscript)
  }

  get isSuperScriptActive() {
    return this.isMarkActive(schema.marks.superscript)
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
    return (this.props.isDisabled) ?
      false :
      this.send(match(this.props.keymap, event))
  }

  handleFocus = (...args) => {
    this.props.onFocus(...args)
  }

  handleBlur = (...args) => {
    this.props.onBlur(...args)
  }


  send(action, view = this.pm) {
    return (commands[action]) ?
      commands[action](view.state, view.dispatch, view) :
      false
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
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onFocus: func.isRequired
  }
}

module.exports = {
  EditorView: ProseMirror
}
