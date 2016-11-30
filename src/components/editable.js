'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { noop } = require('../common/util')
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
    if (this.changed) {
      this.props.onChange(this.state.value)
    } else {
      this.props.onCancel()
    }
  }

  cancel() {
    this.setState({ value: this.props.value })
    this.props.onCancel()
  }

  keyup = (event) => {
    if (event.which === 27) this.cancel()
    if (event.which === 13) this.stop()
  }

  activate = (event) => {
    event.stopPropagation()
    if (!this.props.isDisabled) this.props.onActivate()
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
    const { isEditing, isDisabled, value } = this.props

    if (!isDisabled && isEditing) {
      return (
        <input
          className="editable editable-control"
          type="text"
          ref={this.focus}
          value={this.state.value}
          onChange={this.update}
          onKeyUp={this.keyup}
          onBlur={this.stop}/>
      )
    }

    return (
      <span
        className={cn({ editable: true, empty: !value, disabled: isDisabled })}
        onDoubleClick={this.activate}>
        {value}
      </span>
    )
  }


  static propTypes = {
    isEditing: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isRequired: PropTypes.bool,

    value: PropTypes.string,
    onActivate: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func
  }

  static defaultProps = {
    onActivate: noop,
    onCancel: noop
  }
}

module.exports = {
  Editable
}
