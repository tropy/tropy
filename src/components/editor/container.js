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
    this.state = {}
  }

  componentDidMount() {
    this.setState(this.getActiveMarks(this.view))
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
      'is-blurred': !this.state.hasViewFocus
    }
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

  handleFocus = (event) => {
    if (event.target === this.container) {
      setTimeout(this.view.focus, 0)
    }
  }

  handleCommand = (command) => {
    this.view.send(command)
    if (!this.state.hasViewFocus) this.view.focus()
  }

  handleViewFocus = () => {
    this.setState({ hasViewFocus: true })
  }

  handleViewBlur = () => {
    this.setState({ hasViewFocus: false })
  }

  render() {
    const { content, isDisabled, keymap, tabIndex, onChange } = this.props

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
            content={content}
            isDisabled={isDisabled}
            tabIndex={tabIndex}
            keymap={keymap}
            onFocus={this.handleViewFocus}
            onBlur={this.handleViewBlur}
            onChange={onChange}/>
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
