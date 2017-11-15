'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, number, oneOfType, string } = require('prop-types')
const { Input } = require('./input')
const cx = require('classnames')


class Editable extends PureComponent {
  get classes() {
    return {
      editable: true,
      disabled: this.props.isDisabled
    }
  }

  get content() {
    return this.props.display || this.props.value
  }

  get isActive() {
    return this.props.isActive && !this.props.isDisabled
  }

  setInput = (input) => {
    this.input = input
  }

  focus = () => {
    if (this.input != null) this.input.focus()
  }

  handleCommit = (value, hasChanged) => {
    if (hasChanged) {
      this.props.onChange(value)
    } else {
      this.props.onCancel(true)
    }
  }

  renderContent() {
    return (
      <div className="truncate">{this.content}</div>
    )
  }

  renderInput() {
    return (
      <Input
        ref={this.setInput}
        autofocus={this.props.autofocus}
        className="editable-control"
        isRequired={this.props.isRequired}
        placeholder={this.props.placeholder}
        tabIndex={this.props.tabIndex}
        type={this.props.type}
        resize={this.props.resize}
        value={this.props.value || ''}
        onBlur={this.props.onBlur}
        onCancel={this.props.onCancel}
        onCommit={this.handleCommit}
        onFocus={this.props.onFocus}
        onKeyDown={this.props.onKeyDown}/>
    )
  }

  render() {
    return (
      <div className={cx(this.classes)}>
        {this.isActive ?
          this.renderInput() :
          this.renderContent()}
      </div>
    )
  }

  static propTypes = {
    autofocus: bool,
    display: string,
    isActive: bool,
    isDisabled: bool,
    isRequired: bool,
    placeholder: string,
    resize: bool,
    tabIndex: number,
    type: string,
    value: oneOfType([string, number]),
    onBlur: func,
    onCancel: func.isRequired,
    onChange: func.isRequired,
    onFocus: func,
    onKeyDown: func,
  }

  static defaultProps = {
    autofocus: true
  }
}

module.exports = {
  Editable
}
