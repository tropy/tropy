'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { func, bool, object, number } = PropTypes

const { EditorToolbar } = require('./toolbar')
const { EditorView } = require('./view')


class Editor extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
    }
  }

  setView = (view) => {
    this.view = view
  }

  handleClick = () => {
    this.view.focus()
  }

  handleCommand = (command) => {
    this.view.send(command)
  }

  handleChange = (view) => {
    this.setState({
      isBoldActive: view.isBoldActive,
      isItalicActive: view.isItalicActive,
      isUnderlineActive: view.isUnderlineActive,
      isStrikeThroughActive: view.isStrikeThroughActive
    })
  }

  render() {
    const { doc, isDisabled, keymap, tabIndex } = this.props

    return (
      <div className="editor" onClick={this.handleClick}>
        <EditorToolbar
          isBoldActive={this.state.isBoldActive}
          isItalicActive={this.state.isItalicActive}
          isUnderlineActive={this.state.isUnderlineActive}
          isStrikeThroughActive={this.state.isStrikeThroughActive}
          isDisabled={isDisabled}
          onCommand={this.handleCommand}/>

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

