'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, number, oneOf, oneOfType, string } = require('prop-types')
const { noop } = require('../common/util')


class BufferedInput extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value
    }
  }

  componentWillReceiveProps({ value }) {
    this.setState({ value })
    this.clearResetTimeout()

    this.hasBeenCommitted = false
    this.hasBeenCancelled = false
  }

  componentWillUnmount() {
    this.clearResetTimeout()
  }

  get isEmpty() {
    return !this.state.value
  }

  get isValid() {
    return !this.props.isRequired || !this.isEmpty
  }

  get hasChanged() {
    return this.state.value !== this.props.value
  }

  autofocus = (input) => {
    if (input && this.props.autofocus) {
      input.focus()
      input.select()
    }
  }

  reset = () => {
    this.setState({ value: this.props.value })
    this.clearResetTimeout()
  }

  commit(force) {
    if (force || this.isValid) {
      this.props.onCommit(this.state.value, this.hasChanged, force)
      this.hasBeenCommitted = true

      if (this.hasChanged && this.props.delay > 0) {
        this.tm = setTimeout(this.reset, this.props.delay)
      }

    } else {
      this.cancel()
    }
  }

  cancel() {
    this.hasBeenCancelled = true
    this.reset()
    this.props.onCancel()
  }

  clearResetTimeout() {
    if (this.tm != null) {
      clearTimeout(this.tm)
      this.tm = null
    }
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
    this.props.onChange(event.target.value)
  }

  handleBlur = (event) => {
    const cancel = this.props.onBlur(event)
    if (this.hasBeenCancelled || this.hasBeenCommitted) return

    if (cancel) {
      this.cancel()
    } else {
      this.commit()
    }
  }

  handleFocus = (event) => {
    this.hasBeenCancelled = false
    this.hasBeenCommitted = false
    this.props.onFocus(event)
  }

  handleKeyDown = (event) => {
    switch (event.key) {
      case 'Escape':
        this.cancel()
        break
      case 'Enter':
        this.commit(true)
        break
    }

    event.stopPropagation()
  }


  render() {
    return (
      <input
        id={this.props.id}
        className={this.props.className}
        disabled={this.props.isDisabled}
        placeholder={this.props.placeholder}
        ref={this.autofocus}
        required={this.props.isRequired}
        tabIndex={this.props.tabIndex}
        type={this.props.type}
        value={this.state.value}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}/>
    )
  }

  static propTypes = {
    autofocus: bool,
    className: string,
    delay: number.isRequired,
    id: string,
    isDisabled: bool,
    isRequired: bool,
    placeholder: string,
    tabIndex: number,
    type: oneOf(['text', 'number']).isRequired,
    value: oneOfType([string, number]).isRequired,
    onBlur: func.isRequired,
    onCancel: func.isRequired,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    onFocus: func.isRequired
  }

  static defaultProps = {
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
  BufferedInput
}
