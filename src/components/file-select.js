'use strict'

const React = require('react')
const { noop } = require('../common/util')
const { Button, ButtonGroup } = require('./button')
const { open } = require('../dialog')

const {
  bool, func, number, object, oneOfType, oneOf, string, arrayOf
} = require('prop-types')


class FileSelect extends React.PureComponent {
  clear() {
    this.handleChange(null)
  }

  handleBlur = (event) => {
    this.props.onBlur(event)
  }

  handleFocus = (event) => {
    this.props.onFocus(event)
  }

  handleChange = (value) => {
    this.props.onChange(value)
  }

  handleKeyDown = (event) => {
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
  }

  handleFileClick = () => {
    const { filters, type } = this.props
    open({
      defaultPath: this.props.defaultDirectory,
      filters: filters,
      properties: type === 'file' ? ['openFile'] : ['openDirectory']
    }).then((res) => {
      if (res.length) {
        this.handleChange(res[0])
      }
    })
  }

  handleClearButtonClick = () => {
    this.clear()
  }


  render() {
    return (<div className="input-group">
      <div className="form-control"
        tabIndex={this.props.tabIndex}
        onKeyDown={this.handleKeyDown}
        onClick={this.handleFocus}
        onDoubleClick={this.handleFileClick}
        onBlur={this.handleBlur}>
        <span type="text">{this.props.value}</span>
      </div>
      <ButtonGroup>
        {!this.props.isRequired && (
        <Button
          className="btn-default"
          onClick={this.handleClearButtonClick}
          text="select.clear" />
        )}
        <Button
          className="btn-default"
          onClick={this.handleFileClick}
          text="select.browse" />
      </ButtonGroup>
    </div>)
  }

  static propTypes = {
    defaultDirectory: string,
    filters: arrayOf(object),
    id: string,
    isRequired: bool,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onFocus: func.isRequired,
    tabIndex: number,
    type: oneOf(['file', 'directory']).isRequired,
    value: oneOfType([string]).isRequired

  }

  static defaultProps = {
    defaultDirectory: '',
    filters: [],
    onBlur: noop,
    onChange: noop,
    onFocus: noop,
    tabIndex: -1,
    type: 'file',
    value: null
  }
}

module.exports = {
  FileSelect
}
