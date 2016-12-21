'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { noop, pick } = require('../common/util')
const cn = require('classnames')

class Editable extends Component {

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

  update = (event) => {
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
    const props = pick(this.props, ['onClick'])

    if (isEditing) {
      return (
        <input {...props}
          className="editable editable-control"
          type={type}
          value={this.state.value}
          disabled={isDisabled}
          required={isRequired}
          ref={this.focus}
          onChange={this.update}
          onKeyUp={this.handleKeyUp}
          onBlur={this.stop}/>
      )
    }

    return (
      <div {...props} className={cn({
        editable: true,
        disabled: isDisabled
      })}>
        {value}
      </div>
    )
  }


  static propTypes = {
    isEditing: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isRequired: PropTypes.bool,
    value: PropTypes.string,
    type: PropTypes.oneOf(['text', 'number']),
    onClick: PropTypes.func,
    onChange: PropTypes.func,
    onCancel: PropTypes.func
  }

  static defaultProps = {
    type: 'text',
    onCancel: noop,
    onChange: noop
  }
}

module.exports = {
  Editable
}
