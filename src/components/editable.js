'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, number, oneOfType, string } = require('prop-types')
const { BufferedInput } = require('./input')
const cx = require('classnames')


class Editable extends PureComponent {
  get classes() {
    return {
      editable: true,
      disabled: this.props.isDisabled
    }
  }

  setInput = (input) => {
    this.input = input
  }

  handleCommit = (value, hasChanged) => {
    if (hasChanged) {
      this.props.onChange(value)
    } else {
      this.props.onCancel(true)
    }
  }

  render() {
    const { isEditing, isDisabled, value, display, ...props } = this.props

    if (!isEditing || isDisabled) {
      return (<div className={cx(this.classes)}>{display || value}</div>)
    }

    delete props.onChange

    return (
      <BufferedInput {...props}
        ref={this.setInput}
        className={cx({ ...this.classes, 'editable-control': true })}
        value={value || ''}
        onCommit={this.handleCommit}/>
    )
  }

  static propTypes = {
    autofocus: bool,
    isDisabled: bool,
    isEditing: bool,
    resize: bool,
    value: oneOfType([string, number]),
    display: string,
    onCancel: func.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    autofocus: true
  }
}

module.exports = {
  Editable
}
