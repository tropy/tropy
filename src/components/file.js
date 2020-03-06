'use strict'

const React = require('react')
const { noop } = require('../common/util')
const { Button } = require('./button')
const { open, save } = require('../dialog')
const {
  bool, func, number, object, oneOf, string, arrayOf
} = require('prop-types')


class FileSelect extends React.PureComponent {
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
      case 'Escape':
        this.reset()
        break
      case 'Backspace':
        this.clear()
        break
      case 'Enter':
      case 'Space':
        this.handleClick()
        break
      default:
        return null
    }

    event.preventDefault()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleClick = async () => {
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

    if (value != null)
      this.handleChange(value)
  }

  showDialog(opts, { type, fileDialogType } = this.props) {
    return (type === 'file' && fileDialogType === 'save') ?
      save(opts) :
      open(opts).then(res => Array.isArray(res) ? res[0] : res)
  }

  render() {
    return (
      <div className="input-group">
        <div
          className="form-control file-select disabled"
          tabIndex={this.props.tabIndex}
          onBlur={this.props.onBlur}
          onDoubleClick={this.handleClick}
          onFocus={this.props.onFocus}
          onKeyDown={this.handleKeyDown}>
          <div className="truncate">{this.props.value}</div>
        </div>
        <div className="input-group-append">
          {!this.props.isRequired && (
          <Button
            isDefault
            noFocus
            onClick={this.clear}
            text="select.clear"/>
          )}
          <Button
            isDefault
            noFocus
            onClick={this.handleClick}
            text="select.browse"/>
        </div>
      </div>
    )
  }

  static propTypes = {
    defaultPath: string,
    fileDialogType: oneOf(['open', 'save']).isRequired,
    filters: arrayOf(object),
    isRequired: bool,
    onBlur: func,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    onFocus: func,
    onKeyDown: func,
    showHiddenFiles: bool,
    tabIndex: number,
    type: oneOf(['file', 'directory']).isRequired,
    value: string
  }

  static defaultProps = {
    fileDialogType: 'open',
    onChange: noop,
    onCommit: noop,
    tabIndex: -1,
    type: 'file'
  }
}

module.exports = {
  FileSelect
}
