'use strict'

const React = require('react')
const { noop } = require('../common/util')
const { Button } = require('./button')
const { open, save } = require('../dialog')
const { bool, func, number, object, oneOf, string, arrayOf
} = require('prop-types')


class FileSelect extends React.PureComponent {
  clear() {
    this.handleChange(null)
  }

  handleChange = (value) => {
    this.props.onChange(value)
    this.props.onCommit(value, value !== this.props.value)
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
        this.handleFileClick()
        break
      default:
        return null
    }

    event.preventDefault()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleFileClick = () => {
    const { defaultPath, filters, type, showHiddenFiles } = this.props
    const properties = type === 'file' ? ['openFile'] : ['openDirectory']
    if (showHiddenFiles)
      properties.push('showHiddenFiles')

    const obj = { defaultPath, properties }

    if (filters)
      obj.filters = filters

    if (this.props.fileDialogType === 'save') {
      save(obj).then((res) => {
        if (res.length) {
          this.handleChange(res)
        }
      })
    } else {
      open(obj).then((res) => {
        if (res.length) {
          this.handleChange(res[0])
        }
      })
    }

  }

  handleClearButtonClick = () => {
    this.clear()
  }


  render() {
    return (<div className="input-group">
      <div className="form-control file-select disabled"
        tabIndex={this.props.tabIndex}
        onKeyDown={this.handleKeyDown}
        onDoubleClick={this.handleFileClick}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}>
        <div className="truncate">{this.props.value}</div>
      </div>
      <div className="input-group-append">
        {!this.props.isRequired && (
        <Button
          isDefault
          noFocus
          onClick={this.handleClearButtonClick}
          text="select.clear" />
        )}
        <Button
          isDefault
          noFocus
          onClick={this.handleFileClick}
          text="select.browse" />
      </div>
    </div>)
  }

  static propTypes = {
    defaultPath: string,
    fileDialogType: oneOf(['open', 'save']).isRequired,
    filters: arrayOf(object),
    id: string,
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
    fileDialogType: 'save',
    onChange: noop,
    tabIndex: -1,
    type: 'file'
  }
}

module.exports = {
  FileSelect
}
