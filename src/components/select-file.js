'use strict'

const React = require('react')
const { noop } = require('../common/util')
const { AutoResizer } = require('./auto-resizer')
const { Button, ButtonGroup } = require('./button')

const { StaticField } = require('./metadata/field')

const { open } = require('../dialog')

//const { open } = require('../browser/dialog')


const {
  bool, func, number, object, oneOfType, oneOf, string, arrayOf
} = require('prop-types')


class SelectFile extends React.PureComponent {
  input = React.createRef()

  state =  {
    hasFocus: false,
    key: this.props.value,
    query: '',
    value: this.props.value
  }

  static getDerivedStateFromProps(props, state) {
    return (props.value === state.key) ? null : {
      key: props.value,
      query: '',
      value: props.value
    }
  }

  componentDidMount() {
    if (this.props.autofocus)
      this.input.current.focus()
  }


  get isValid() {
    return this.input.current.validity.valid
  }

  get hasChanged() {
    return this.state.value !== this.state.key
  }

  cancel = (isForced) => {
    this.hasBeenCancelled = true

    if (this.isValid) {
      this.props.onCancel(this.hasChanged, isForced)
    } else {
      this.reset()
      this.props.onCancel(false, isForced)
    }
  }

  commit(isForced) {
    if (this.isValid) {
      if (!this.hasBeenCommitted) {
        this.hasBeenCommitted = true
        this.props.onCommit(this.state.value, this.hasChanged, isForced)
      }
    } else {
      this.cancel()
    }
  }

  focus = () => {
    if (this.input.current)
      this.input.current.focus()
  }

  reset() {
    this.hasBeenCancelled = false
    this.hasBeenCommitted = false

    this.setState({
      key: this.props.value,
      query: '',
      value: this.props.value
    })
  }

  handleBlur = (event) => {
    let cancel = this.props.onBlur(event)
    this.setState({ hasFocus: false })

    if (this.hasBeenCancelled || this.hasBeenCommitted)
      return null
    if (cancel)
      this.cancel()
    else
      this.commit()
  }

  handleFocus = (event) => {
    this.props.onFocus(event)


    this.hasBeenCancelled = false
    this.hasBeenCommitted = false

    this.setState({
      hasFocus: true
    })
  }

  handleChange = ({ target }) => {
    this.setState({ value: target.value, query: target.value })
    this.props.onChange(target.value)
  }

  handleCompletion = (value) => {
    this.setState({ value }, () => this.commit(true))
    this.props.onChange(value)
  }

  handleKeyDown = (event) => {
    if (this.props.onKeyDown != null) {
      if (this.props.onKeyDown(event, this))
        return null
    }

    event.stopPropagation()

    // Prevent default and global bindings if we handled the key!
    event.preventDefault()
    event.nativeEvent.stopImmediatePropagation()
  }


  handleFileClick = () => {
    const { filters, type } = this.props
    open.custom({
      defaultDirectory: this.props.defaultDirectory,
      filters: filters,
      properties: type === 'file' ? ['openFile'] : ['openDirectory']
    })
  }

  handleClearButtonClick = (event) => {
    this.props.onClear(this.props.value)
    event.stopPropagation()
  }


  render() {
    return (
      <div className="input-group">
        <AutoResizer
          content={this.state.value}
          isDisabled={!this.props.resize}>

          <span
            onClick={this.handleFileClick}>{this.props.value}
          </span>
          <ButtonGroup>
            {!this.props.isRequired && (
            <Button
              onClick={this.handleClearButtonClick}
              text="select.clear" />
            )}
            <Button
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
    placeholder: string,
    resize: bool,
    tabIndex: number,
    value: oneOfType([string]).isRequired,
    onBlur: func.isRequired,
    onCancel: func.isRequired,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    onFocus: func.isRequired,
    onClear: func,
    onKeyDown: func,

    type: oneOf(['file', 'directory']).isRequired,
    filters: arrayOf(object),
    defaultDirectory: string

  }

  static defaultProps = {
    tabIndex: -1,
    onBlur: noop,
    onCancel: noop,
    onChange: noop,
    onCommit: noop,
    onFocus: noop,
    onClear: noop,
    type: 'directory',
    filters: []
  }
}

module.exports = {
  SelectFile
}
