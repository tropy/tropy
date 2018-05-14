'use strict'

const React = require('react')
const { Component } = React
const { noop } = require('../common/util')
const { AutoResizer } = require('./auto-resizer')
const { Completions } = require('./completions')
const { blank } = require('../common/util')
const {
  array, bool, func, number, oneOf, oneOfType, string
} = require('prop-types')


class Input extends Component {
  constructor(props) {
    super(props)
    this.state =  {
      value: props.value,
      hasFocus: false
    }
  }

  componentWillReceiveProps({ value }) {
    if (value !== this.props.value) {
      this.hasBeenCommitted = false
      this.hasBeenCancelled = false
      this.setState({ value })
    }
  }

  componentWillUnmount() {
    this.clearResetTimeout()
  }

  get isValid() {
    return !this.props.isRequired || !blank(this.state.value)
  }

  get hasChanged() {
    return this.state.value !== this.props.value
  }

  get hasCompletions() {
    return this.state.hasFocus && this.props.completions.length > 0
  }

  setCompletions = (completions) => {
    this.completions = completions
  }

  setInput = (input) => {
    if (input != null && this.props.autofocus) {
      input.focus()
      input.select()
    }

    this.input = input
  }

  focus = () => {
    if (this.input != null) this.input.focus()
  }

  reset = () => {
    this.hasBeenCommitted = false
    this.hasBeenCancelled = false
    this.setState({ value: this.props.value })
    this.clearResetTimeout()
  }

  commit(force) {
    if (force || this.isValid) {
      if (!this.hasBeenCommitted) {
        this.hasBeenCommitted = true
        this.props.onCommit(this.state.value, this.hasChanged, force)

        if (this.hasChanged && this.props.delay > 0) {
          this.clearResetTimeout()
          this.tm = setTimeout(this.reset, this.props.delay)
        }
      }

    } else {
      this.cancel()
    }
  }

  cancel = (force) => {
    const { hasChanged } = this

    this.reset()
    this.hasBeenCancelled = true
    this.props.onCancel(hasChanged, force)
  }

  clearResetTimeout() {
    if (this.tm != null) {
      clearTimeout(this.tm)
      this.tm = null
    }
  }

  handleChange = ({ target }) => {
    this.setState({ value: target.value })
    this.props.onChange(target.value)
  }

  handleCompletion = (value) => {
    this.setState({ value }, this.commit)
    this.props.onChange(value)
  }

  handleBlur = (event) => {
    this.setState({ hasFocus: false })

    const cancel = this.props.onBlur(event)
    if (this.hasBeenCancelled || this.hasBeenCommitted) return

    if (cancel) {
      this.cancel()
    } else {
      this.commit()
    }
  }

  handleFocus = (event) => {
    this.setState({ hasFocus: true })

    this.hasBeenCancelled = false
    this.hasBeenCommitted = false
    this.props.onFocus(event)
  }

  handleKeyDown = (event) => {
    if (this.props.onKeyDown != null) {
      if (this.props.onKeyDown(event, this)) return
    }

    // TODO Some Editables (e.g., in ItemTable expect active Inputs
    // to swallow all key presses; ideally, they should remove their
    // own key bindings while an Input is active.
    event.stopPropagation()

    if (!this.handleCompletionsKeyDown(event)) {
      switch (event.key) {
        case 'Escape':
          this.cancel(true)
          break
        case 'Enter':
          this.commit(true)
          break
        default:
          return
      }
    }

    // Prevent default and global bindings if we handled the key!
    event.preventDefault()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleCompletionsKeyDown(event) {
    const { completions } = this
    if (completions == null) return false

    switch (event.key) {
      case 'Enter':
        if (completions.state.active == null) return false
        this.handleCompletion(completions.state.active)
        break
      case 'ArrowDown':
        completions.next()
        break
      case 'ArrowUp':
        completions.prev()
        break
      default:
        return false
    }

    return true
  }

  renderCompletions() {
    if (!this.hasCompletions) return null
    const { className } = this.props

    return (
      <Completions
        ref={this.setCompletions}
        className={className ? `${className}-completions` : null}
        completions={this.props.completions}
        minQueryLength={1}
        onClickOutside={this.cancel}
        onSelect={this.handleCompletion}
        parent={this.input}
        query={this.state.value}/>
    )
  }

  renderInput() {
    const input = (
      <input
        id={this.props.id}
        className={this.props.className}
        disabled={this.props.isDisabled}
        placeholder={this.props.placeholder}
        ref={this.setInput}
        readOnly={this.props.isReadOnly}
        required={this.props.isRequired}
        tabIndex={this.props.tabIndex}
        type={this.props.type}
        value={this.state.value}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}/>
    )

    return (this.props.resize) ?
      <AutoResizer content={this.state.value}>{input}</AutoResizer> :
      input
  }

  render() {
    return (
      <div className="input-group">
        {this.renderInput()}
        {this.renderCompletions()}
      </div>
    )
  }

  static propTypes = {
    autofocus: bool,
    completions: array.isRequired,
    className: string,
    delay: number.isRequired,
    id: string,
    isDisabled: bool,
    isReadOnly: bool,
    isRequired: bool,
    placeholder: string,
    resize: bool,
    tabIndex: number,
    type: oneOf(['text', 'number']).isRequired,
    value: oneOfType([string, number]).isRequired,
    onBlur: func.isRequired,
    onCancel: func.isRequired,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    onFocus: func.isRequired,
    onKeyDown: func,
  }

  static defaultProps = {
    completions: [],
    delay: 100,
    tabIndex: -1,
    type: 'text',
    onBlur: noop,
    onCancel: noop,
    onChange: noop,
    onCommit: noop,
    onFocus: noop
  }
}

module.exports = {
  Input
}
