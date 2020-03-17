'use strict'

const React = require('react')
const { blank, noop } = require('../common/util')
const { Button } = require('./button')
const { open, save } = require('../dialog')

const {
  bool, func, number, object, oneOf, string, arrayOf
} = require('prop-types')

const cx = require('classnames')


class FileSelect extends React.PureComponent {
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

    this.props.onCommit(value, hasChanged)
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

    if (value != null && value !== '') {
      this.handleChange(value)
    }

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

  static propTypes = {
    className: string,
    createFile: bool,
    defaultPath: string,
    filters: arrayOf(object),
    id: string,
    isDisabled: bool,
    isRequired: bool,
    onBlur: func,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    onFocus: func,
    onKeyDown: func,
    placeholder: string,
    showHiddenFiles: bool,
    tabIndex: number,
    type: oneOf(['file', 'directory']).isRequired,
    value: string
  }

  static defaultProps = {
    onChange: noop,
    onCommit: noop,
    tabIndex: -1,
    type: 'file'
  }
}

module.exports = {
  FileSelect
}
