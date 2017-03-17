'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { func, bool, object, number } = PropTypes

const { EditorToolbar } = require('./toolbar')
const { EditorView } = require('./view')

const cx = require('classnames')
const { pick } = require('../../common/util')


class Editor extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  setView = (view) => {
    this.view = view
  }

  get classes() {
    return {
      'editor': true,
      'is-blurred': !this.state.hasEditorFocus
    }
  }

  getActiveMarks(from = this.state) {
    return pick(from, [
      'isBoldActive',
      'isItalicActive',
      'isUnderlineActive',
      'isStrikeThroughActive'
    ])
  }

  handleFocus = (event) => {
    if (event.target === this.container) {
      setTimeout(this.view.focus, 0)
    }
  }

  handleCommand = (command) => {
    this.view.send(command)
  }

  handleViewFocus = () => {
    this.setState({ hasEditorFocus: true })
  }

  handleViewBlur = () => {
    this.setState({ hasEditorFocus: false })
  }

  handleChange = (view) => {
    this.setState(this.getActiveMarks(view))
  }

  render() {
    const { doc, isDisabled, keymap, tabIndex } = this.props

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
            doc={doc}
            isDisabled={isDisabled}
            tabIndex={tabIndex}
            keymap={keymap}
            onFocus={this.handleViewFocus}
            onBlur={this.handleViewBlur}
            onChange={this.handleChange}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    doc: object,
    isDisabled: bool,
    keymap: object.isRequired,
    value: object,
    onChange: func,
    tabIndex: number.isRequired
  }

  static defaultProps = {
    tabIndex: -1
  }
}

module.exports = {
  Editor
}
