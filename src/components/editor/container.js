'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { func, bool, object, number } = PropTypes

const { EditorToolbar } = require('./toolbar')
const { EditorView } = require('./view')

const { pick } = require('../../common/util')


class Editor extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
    }
  }

  setView = (view) => {
    this.view = view
  }

  getActiveMarks(from = this.state) {
    return pick(from, [
      'isBoldActive',
      'isItalicActive',
      'isUnderlineActive',
      'isStrikeThroughActive'
    ])
  }

  handleFocus = () => {
    this.view.focus()
  }

  handleCommand = (command) => {
    this.view.send(command)
  }

  handleChange = (view) => {
    this.setState(this.getActiveMarks(view))
  }

  render() {
    const { doc, isDisabled, keymap, tabIndex } = this.props

    return (
      <div
        className="editor"
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

