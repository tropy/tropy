'use strict'

const React = require('react')

const { Component, PropTypes } = React

class Editable extends Component {
  static propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      editing: false,
      value: props.value
    }
  }

  update = (event) => {
    this.setState({ value: event.target.value })
  }

  start = () => {
    this.setState({ editing: true })
  }

  stop = () => {
    this.props.onChange(this.state.value)
    this.setState({ editing: false })
  }

  componentWillReceiveProps({ value }) {
    this.setState({ value, editing: false })
  }

  render() {
    return (this.state.editing) ? (
      <input
        className="editable"
        type="text"
        value={this.state.value}
        onChange={this.update}
        onBlur={this.stop}/>
    ) : (
      <span
        className="editable"
        onDoubleClick={this.start}>
        {this.props.value}
      </span>
    )
  }
}

module.exports = {
  Editable
}
