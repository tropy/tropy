'use strict'

const React = require('react')
const { noop } = require('../common/util')
const { Button, ButtonGroup } = require('./button')
const { open } = require('../dialog')

const {
  bool, func, number, object, oneOfType, oneOf, string, arrayOf
} = require('prop-types')


class SelectFile extends React.PureComponent {
  selectfile = React.createRef()

  clear() {
    this.handleChange('')
  }

  handleBlur = (event) => {
    this.props.onBlur(event)
  }

  handleFocus = (event) => {
    this.props.onFocus(event)
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

  handleChange = (value) => {
    this.props.onChange(value)
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
    autofocus: bool,
    className: string,
    id: string,
    isDisabled: bool,
    isReadOnly: bool,
    isRequired: bool,
    resize: bool,
    tabIndex: number,
    value: oneOfType([string]).isRequired,
    onBlur: func.isRequired,
    onCancel: func.isRequired,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    onFocus: func.isRequired,
    onClear: func,
    onClick: func.isRequired,
    onKeyDown: func,

    type: oneOf(['file', 'directory']).isRequired,
    filters: arrayOf(object),
    defaultDirectory: string

  }

  static defaultProps = {
    defaultDirectory: '',
    tabIndex: -1,
    onBlur: noop,
    onCancel: noop,
    onChange: noop,
    onCommit: noop,
    onFocus: noop,
    onClear: noop,
    onClick: noop,
    type: 'file',
    filters: []
  }
}

module.exports = {
  SelectFile
}
