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
      state: this.getEditorState(),
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

    if (props.content !== this.content) {
      this.replace(props)
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

  isMarkActive(type, state = this.pm.state) {
    const { from, $from, to, empty } = state.selection

    return (empty) ?
      !!type.isInSet(state.storedMarks || $from.marks()) :
      state.doc.rangeHasMark(from, to, type)
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

  get isStrikethroughActive() {
    return this.isMarkActive(schema.marks.strikethrough)
  }

  get isSubscriptActive() {
    return this.isMarkActive(schema.marks.subscript)
  }

  get isSuperscriptActive() {
    return this.isMarkActive(schema.marks.superscript)
  }

  get content() {
    return this.pm.state
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
    this.props.onChange(this.pm.state.apply(tr), tr.docChanged, this.pm)
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


  getEditorState(props = this.props) {
    if (props.content == null) {
      return EditorState.create({ schema, plugins })
    }

    if (props.content instanceof EditorState) {
      return props.content
    }

    return EditorState.fromJSON({ schema, plugins }, props.content)
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
    this.pm.updateState(this.getEditorState(props))
  }

  render() {
    return (
      <div ref={this.setContainer} className="prose-mirror-container"/>
    )
  }

  static propTypes = {
    content: object,
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
