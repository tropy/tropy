import React from 'react'
import { blank, noop } from '../common/util.js'
import { Button } from './button.js'
import { open, save } from '../dialog.js'
import cx from 'classnames'


export class FileSelect extends React.PureComponent {
  get tabIndex() {
    return this.props.isDisabled ? null : this.props.tabIndex
  }

  clear = () => {
    this.handleChange(null)
  }

  reset = () => {
    this.handleChange(this.props.value)
  }

  handleChange = (value) => {
    let hasChanged = value !== this.props.value

    if (hasChanged)
      this.props.onChange(value)

    this.props.onCommit(value, { hasChanged })
  }

  handleKeyDown = (event) => {
    if (this.props.onKeyDown != null) {
      if (this.props.onKeyDown(event, this))
        return null
    }

    event.stopPropagation()

    switch (event.key) {
      case 'Backspace':
        this.clear()
        break
      case 'Enter':
      case ' ':
        this.handleClick()
        break
      default:
        return null
    }

    event.preventDefault()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleClick = async () => {
    if (this.props.isDisabled)
      return

    let { defaultPath, filters, type } = this.props

    let properties = (type === 'file') ?
        ['openFile'] :
        ['openDirectory']

    if (this.props.showHiddenFiles)
      properties.push('showHiddenFiles')

    let value = await this.showDialog({
      defaultPath,
      filters,
      properties
    })

    if (!blank(value))
      this.handleChange(value)
  }

  showDialog(opts, { type, createFile } = this.props) {
    return (type === 'file' && createFile) ?
      save(opts) :
      open(opts).then(res => Array.isArray(res) ? res[0] : res)
  }

  render() {
    let isBlank = blank(this.props.value)

    return (
      <div className="input-group">
        <div
          className={cx('file-select', this.props.className, {
            disabled: this.props.isDisabled
          })}
          id={this.props.id}
          tabIndex={this.tabIndex}
          title={this.props.value}
          onBlur={this.props.onBlur}
          onClick={this.handleClick}
          onFocus={this.props.onFocus}
          onKeyDown={this.handleKeyDown}>
          <div className={cx('truncate', { placeholder: isBlank })}>
            {isBlank ? this.props.placeholder : this.props.value}
          </div>
        </div>
        <div className="input-group-append">
          {!this.props.isRequired && (
            <Button
              isDefault
              isDisabled={isBlank || this.props.isDisabled}
              noFocus
              onClick={this.clear}
              text="select.file.clear"/>
          )}
          <Button
            isDefault
            isDisabled={this.props.isDisabled}
            noFocus
            onClick={this.handleClick}
            text="select.file.browse"/>
        </div>
      </div>
    )
  }

  static defaultProps = {
    onChange: noop,
    onCommit: noop,
    tabIndex: -1,
    type: 'file'
  }
}
