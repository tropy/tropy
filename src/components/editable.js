'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { bool, func, string, oneOf } = PropTypes
const cx = require('classnames')
const { noop } = require('../common/util')


class Editable extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value || ''
    }
  }

  componentWillReceiveProps({ value }) {
    this.setState({ value: value || '' })
  }


  get isValid() {
    return this.state.value !== '' || !this.props.isRequired
  }

  get hasChanged() {
    return this.state.value !== (this.props.value || '') && this.isValid
  }

  autofocus = (input) => {
    if (input && this.props.autofocus) {
      input.focus()
      input.select()
    }
  }

  stop = (isCommit) => {
    if (this.hasChanged) {
      this.props.onChange(this.state.value)
    } else {
      this.props.onCancel(isCommit)
    }
  }

  cancel() {
    this.setState({ value: this.props.value || '' })
    this.props.onCancel()
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
  }

  handleBlur = (event) => {
    if (!this.props.onBlur(event)) {
      this.stop()
    }
  }

  handleKeyDown = (event) => {
    switch (event.key) {
      case 'Escape':
        this.cancel()
        break
      case 'Enter':
        this.stop(true)
        break
    }

    event.stopPropagation()
  }

  render() {
    const {
      type,
      placeholder,
      value,
      isEditing,
      isDisabled,
      isRequired
    } = this.props

    if (isEditing && !isDisabled) {
      return (
        <input
          className="editable editable-control"
          type={type}
          value={this.state.value}
          placeholder={placeholder}
          tabIndex={-1}
          required={isRequired}
          ref={this.autofocus}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          onBlur={this.handleBlur}/>
      )
    }

    return (
      <div className={cx({
        editable: true,
        disabled: isDisabled
      })}>
        {value}
      </div>
    )
  }


  static propTypes = {
    autofocus: bool,
    isEditing: bool,
    isDisabled: bool,
    isRequired: bool,
    placeholder: string,
    type: oneOf(['text', 'number']),
    value: string,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onCancel: func.isRequired
  }

  static defaultProps = {
    autofocus: true,
    type: 'text',
    onBlur: noop
  }
}

module.exports = {
  Editable
}
