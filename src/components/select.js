'use strict'

const React = require('react')
const { Component } = React
const { noop } = require('../common/util')
const { array, func, number, string } = require('prop-types')
const cx = require('classnames')

class Select extends Component {
  constructor(props) {
    super(props)
    this.state = this.getStateFromProps(props)
  }

  componentWillReceiveProps(props) {
    if (props.value !== this.props.value ||
      props.options !== this.props.options) {
      this.setState(this.getStateFromProps(props))
    }
  }

  getStateFromProps({ options, value } = this.props) {
    return {
      value: value && options.find(opt => (opt.id === value || opt === value))
    }
  }

  get classes() {
    return ['select', this.props.className]
  }

  render() {
    return (
      <div className={cx(this.classes)}>
        {this.props.value}
      </div>
    )
  }

  static propTypes = {
    className: string,
    options: array.isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onFocus: func.isRequired,
    tabIndex: number,
    value: string.isRequired
  }

  static defaultProps = {
    onBlur: noop,
    onFocus: noop
  }
}

module.exports = {
  Select
}
