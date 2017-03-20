'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, string, oneOf } = React.PropTypes
const cx = require('classnames')
const { noop } = require('../common/util')


class Editable extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value || ''
    }
  }

  get valid() {
    return !(this.props.isRequired && !this.state.value)
  }

  get changed() {
    return this.state.value !== (this.props.value || '') && this.valid
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
  }

  handleBlur = (event) => {
    if (!this.props.onBlur(event)) {
      this.stop()
    }
  }

  stop = () => {
    const { onCancel, onChange } = this.props

    if (this.changed) {
      onChange(this.state.value)
    } else {
      onCancel()
    }
  }

  cancel() {
    const { value, onCancel } = this.props

    this.setState({ value: value || '' })
    onCancel()
  }

  handleKeyDown = (event) => {
    switch (event.key) {
      case 'Escape':
        this.cancel()
        break
      case 'Enter':
        this.stop()
        break
    }

    event.stopPropagation()
  }

  focus(input) {
    if (input) {
      input.focus()
      input.select()
    }
  }


  componentWillReceiveProps({ value }) {
    this.setState({ value: value || '' })
  }

  render() {
    const { value, type, isEditing, isDisabled, isRequired } = this.props

    if (isEditing && !isDisabled) {
      return (
        <input
          className="editable editable-control"
          type={type}
          value={this.state.value}
          required={isRequired}
          ref={this.focus}
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
    isEditing: bool,
    isDisabled: bool,
    isRequired: bool,
    value: string,
    type: oneOf(['text', 'number']),
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onCancel: func.isRequired
  }

  static defaultProps = {
    type: 'text',
    onBlur: noop
  }
}

module.exports = {
  Editable
}
