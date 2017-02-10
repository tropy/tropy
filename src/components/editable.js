'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, string, oneOf } = React.PropTypes
const cn = require('classnames')


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

  handleKeyUp = (event) => {
    switch (event.which) {
      case 27:
        event.stopPropagation()
        this.cancel()
        break
      case 13:
        event.stopPropagation()
        this.stop()
        break
    }
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
          onKeyUp={this.handleKeyUp}
          onBlur={this.stop}/>
      )
    }

    return (
      <div className={cn({
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
    onChange: func.isRequired,
    onCancel: func.isRequired
  }

  static defaultProps = {
    type: 'text'
  }
}

module.exports = {
  Editable
}
