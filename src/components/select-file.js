'use strict'

const React = require('react')
const { noop } = require('../common/util')
const { AutoResizer } = require('./auto-resizer')
const { Button, ButtonGroup } = require('./button')
const { open } = require('../dialog')

const {
  bool, func, number, object, oneOfType, oneOf, string, arrayOf
} = require('prop-types')


class SelectFile extends React.PureComponent {
  selectfile = React.createRef()

  state =  {
    hasFocus: false,
    value: this.props.value
  }

  componentDidMount() {
    if (this.props.autofocus)
      this.selectfile.current.focus()
  }

  focus = () => {
    if (this.selectfile.current)
      this.selectfile.current.focus()
  }

  clear() {
    this.handleChange('')
  }

  handleBlur = (event) => {
    let cancel = this.props.onBlur(event)
    this.setState({ hasFocus: false })
    if (cancel)
      this.cancel()
  }

  handleFocus = (event) => {
    this.props.onFocus(event)
    this.setState({ hasFocus: true })
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
    if (this.state.value !== value) {
      this.setState({ value })
      this.props.onChange(value)
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
    return (<div
      className="input-group"
      onKeyDown={this.handleKeyDown}
      onBlur={this.handleBlur}
      onFocus={this.handleFocus}>
      <AutoResizer
        content={this.state.value}
        isDisabled={!this.props.resize}>
        <input type="text" className="form-control"
          id={this.props.id}
          value={this.state.value}/>
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
      </AutoResizer>
    </div>
    )
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
