'use strict'

const React = require('react')
const { Component } = React
const { blank, noop, shallow } = require('../common/util')
const { array, func, number, string } = require('prop-types')
const cx = require('classnames')

class Select extends Component {
  constructor(props) {
    super(props)
    this.state = this.getStateFromProps(props)
  }

  componentDidUpdate(_, state) {
    if (this.state.isInvalid  !== state.Invalid) {
      this.props.onValidate(!this.state.isInvalid)
    }
  }

  componentWillReceiveProps(props) {
    if (shallow(this.props, props, ['value', 'options'])) {
      this.setState(this.getStateFromProps(props))
    }
  }

  getStateFromProps({ options, value: id } = this.props) {
    let value = blank(id) ?
      null :
      options.find(opt => opt.id === id || opt === id)

    return {
      isInvalid: value == null && !blank(id),
      value
    }
  }

  get classes() {
    return ['select', this.props.className, {
      invalid: this.state.isInvalid
    }]
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
    onValidate: func.isRequired,
    tabIndex: number,
    value: string.isRequired
  }

  static defaultProps = {
    onBlur: noop,
    onFocus: noop,
    onValidate: noop
  }
}

module.exports = {
  Select
}
