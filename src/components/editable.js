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

  focus = () => {
    if (this.input) this.input.focus()
  }

  handleCommit = (value, hasChanged) => {
    if (hasChanged) {
      this.props.onChange(value)
    } else {
      this.props.onCancel(true)
    }
  }

  render() {
    const {
      isActive,
      isDisabled,
      value,
      display,
      ...props
    } = this.props

    if (!isActive || isDisabled) {
      return (<div className={cx(this.classes)}>{display || value}</div>)
    }

    delete props.onChange

    return (
      <div className={cx(this.classes)}>
        <BufferedInput {...props}
          ref={this.setInput}
          className="editable-control"
          isDisabled={isDisabled}
          value={value || ''}
          onCommit={this.handleCommit}/>
      </div>
    )
  }

  static propTypes = {
    autofocus: bool,
    isActive: bool,
    isDisabled: bool,
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
