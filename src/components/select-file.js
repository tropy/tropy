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
    id: string,
    isRequired: bool,
    tabIndex: number,
    value: oneOfType([string]).isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onFocus: func.isRequired,
    type: oneOf(['file', 'directory']).isRequired,
    filters: arrayOf(object),
    defaultDirectory: string

  }

  static defaultProps = {
    defaultDirectory: '',
    tabIndex: -1,
    onBlur: noop,
    onChange: noop,
    onFocus: noop,
    type: 'file',
    filters: []
  }
}

module.exports = {
  SelectFile
}
