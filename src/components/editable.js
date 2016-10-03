'use strict'

const React = require('react')

const { Component, PropTypes } = React
const { noop } = require('../common/util')

class Editable extends Component {
  static propTypes = {
    value: PropTypes.string,
    required: PropTypes.bool,
    editing: PropTypes.bool,
    onActivate: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func
  }

  static defaultProps = {
    onActivate: noop,
    onCancel: noop
  }

  constructor(props) {
    super(props)

    this.state = {
      value: props.value
    }
  }

  get valid() {
    return !(this.props.required && !this.state.value)
  }

  get changed() {
    return this.state.value !== this.props.value && this.valid
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

  focus(input) {
    if (input) {
      input.focus()
      input.select()
    }
  }


  componentWillReceiveProps({ value }) {
    this.setState({ value })
  }

  render() {
    return (this.props.editing) ? (
      <input
        className="editable editable-control"
        type="text"
        ref={this.focus}
        value={this.state.value}
        onChange={this.update}
        onKeyUp={this.keyup}
        onBlur={this.stop}/>
    ) : (
      <span
        className="editable"
        onDoubleClick={this.props.onActivate}>
        {this.props.value}
      </span>
    )
  }
}

module.exports = {
  Editable
}
