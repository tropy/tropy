'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { func, bool, object, number } = PropTypes

const { EditorToolbar } = require('./toolbar')
const { EditorState } = require('prosemirror-state')
const { EditorView } = require('./view')
const { schema } = require('./schema')
const commands = require('./commands')(schema)
const plugins = require('./plugins')(schema)

const { match } = require('../../keymap')

const cx = require('classnames')
const { pick } = require('../../common/util')


class Editor extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    //this.setState(this.getActiveMarks(this.view))
  }

  setContainer = (container) => {
    this.container = container
  }

  setView = (view) => {
    this.view = view.pm
  }

  get classes() {
    return {
      'editor': true,
      'is-blurred': !this.state.hasViewFocus
    }
  }

  get text() {
    return this.view.dom.innerText.replace(/\s\s+/g, ' ')
  }

  get html() {
    return this.view.dom.innerHtml
  }


  getEditorState({ content } = this.props) {
    if (content == null) {
      return EditorState.create({ schema, plugins })
    }

    if (content instanceof EditorState) {
      return content
    }

    return EditorState.fromJSON({ schema, plugins }, content)
  }

  getActiveMarks(from = this.state) {
    return pick(from, [
      'isBoldActive',
      'isItalicActive',
      'isUnderlineActive',
      'isStrikethroughActive',
      'isSubscriptActive',
      'isSuperscriptActive'
    ])
  }

  //isMarkActive(type, state = this.pm.state) {
  //  const { from, $from, to, empty } = state.selection

  //  return (empty) ?
  //    !!type.isInSet(state.storedMarks || $from.marks()) :
  //    state.doc.rangeHasMark(from, to, type)
  //}

  //get isBoldActive() {
  //  return this.isMarkActive(schema.marks.strong)
  //}

  //get isItalicActive() {
  //  return this.isMarkActive(schema.marks.em)
  //}

  //get isUnderlineActive() {
  //  return this.isMarkActive(schema.marks.underline)
  //}

  //get isStrikethroughActive() {
  //  return this.isMarkActive(schema.marks.strikethrough)
  //}

  //get isSubscriptActive() {
  //  return this.isMarkActive(schema.marks.subscript)
  //}

  //get isSuperscriptActive() {
  //  return this.isMarkActive(schema.marks.superscript)
  //}

  focus = () => {
    this.view.focus()
  }

  handleChange = (tr) => {
    this.props.onChange(this.view.state.apply(tr), tr.docChanged)
  }

  handleKeyDown = (_, event) => {
    return this.handleCommand(match(this.props.keymap, event))
  }

  handleFocus = (event) => {
    if (event.target === this.container) {
      setTimeout(this.focus, 0)
    }
  }

  handleCommand = (command) => {
    const action = commands[command]

    if (action) {
      action(this.view.state, this.view.dispatch, this.view)
      if (!this.state.hasViewFocus) this.focus()

      return true
    }
  }

  handleViewFocus = () => {
    this.setState({ hasViewFocus: true })
  }

  handleViewBlur = () => {
    this.setState({ hasViewFocus: false })
  }

  render() {
    const { isDisabled, tabIndex } = this.props

    return (
      <div
        ref={this.setContainer}
        className={cx(this.classes)}
        tabIndex={-1}
        onFocus={this.handleFocus}>
        {!isDisabled &&
          <EditorToolbar
            {...this.getActiveMarks()}
            onCommand={this.handleCommand}/>
        }

        <div className="scroll-container">
          <EditorView
            ref={this.setView}
            state={this.getEditorState()}
            isDisabled={isDisabled}
            tabIndex={tabIndex}
            onFocus={this.handleViewFocus}
            onBlur={this.handleViewBlur}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    content: object,
    isDisabled: bool,
    keymap: object.isRequired,
    onChange: func.isRequired,
    tabIndex: number.isRequired
  }

  static defaultProps = {
    tabIndex: -1
  }
}

module.exports = {
  Editor
}
