import React from 'react'
import cx from 'classnames'
import { Input } from './input.js'
import { noop } from '../common/util.js'


export class Editable extends React.PureComponent {
  input = React.createRef()

  componentWillUnmount() {
    this.prevFocus = null
  }

  get classes() {
    return ['editable', {
      active: this.isActive,
      disabled: this.props.isDisabled
    }]
  }

  get content() {
    return this.props.display || this.props.value
  }

  get isActive() {
    return this.props.isActive &&
      !this.props.isDisabled &&
      this.props.onChange != null
  }

  focus = () => {
    this.input.current?.focus()
  }

  handleBlur = (event) => {
    try {
      if (this.props.onBlur) {
        return this.props.onBlur(event)
      }
    } finally {
      this.restorePrevFocus()
    }
  }

  handleFocus = (event) => {
    this.prevFocus = event.relatedTarget
    if (this.props.onFocus) {
      return this.props.onFocus(event)
    }
  }

  handleCancel = (...args) => {
    try {
      if (this.props.onCancel) {
        return this.props.onCancel(...args)
      }
    } finally {
      this.restorePrevFocus()
    }
  }

  handleCommit = (value, { hasChanged, hasBeenForced }) => {
    try {
      if (hasChanged || hasBeenForced) {
        this.props.onChange(value, hasChanged, hasBeenForced)
      } else {
        this.props.onCancel(false, hasChanged)
      }
    } finally {
      this.restorePrevFocus()
    }
  }

  restorePrevFocus() {
    if (this.prevFocus != null) {
      this.prevFocus.focus()
      this.prevFocus = null
    }
  }

  renderContent() {
    return (
      <div className="truncate" title={this.props.title} dir="auto">
        {this.content}
      </div>
    )
  }

  renderInput() {
    return (
      <Input
        ref={this.input}
        autofocus={this.props.autofocus}
        autoselect={this.props.autoselect}
        className="editable-control"
        completions={this.props.completions}
        isRequired={this.props.isRequired}
        isReadOnly={this.props.isReadOnly}
        placeholder={this.props.placeholder}
        tabIndex={this.props.tabIndex}
        type={this.props.type}
        max={this.props.max}
        min={this.props.min}
        resize={this.props.resize}
        value={this.props.value || ''}
        onBlur={this.handleBlur}
        onCancel={this.handleCancel}
        onCommit={this.handleCommit}
        onFocus={this.handleFocus}
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

  static defaultProps = {
    autofocus: true,
    autoselect: true,
    onCancel: noop
  }
}
