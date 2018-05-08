'use strict'

const React = require('react')
const { Component } = React
const { Completions } = require('./completions')
const { IconXSmall } = require('./icons')
const { Button } = require('./button')
const { blank, noop, shallow } = require('../common/util')
const { on, off } = require('../dom')
const { array, bool, func, node, number, string } = require('prop-types')
const cx = require('classnames')


class Select extends Component {
  constructor(props) {
    super(props)
    this.state = this.getStateFromProps(props)
  }

  componentDidUpdate(_, state) {
    if (this.state.isInvalid  !== state.Invalid) {
      this.props.onValidate(!this.state.isInvalid)
    }
  }

  componentWillReceiveProps(props) {
    if (!shallow(this.props, props, [
      'isDisabled',
      'isStatic',
      'options',
      'value'
    ])) {
      this.setState(this.getStateFromProps(props))
    }
  }

  componentWillUnmount() {
    if (this.input != null) {
      off(this.input, 'tab:focus', this.handleTabFocus)
    }
  }

  getStateFromProps({
    isDisabled,
    isStatic: isOpen,
    options,
    toId,
    value: id
  } = this.props) {
    let isBlank = blank(id)
    let value = isBlank ?
      null :
      options.find(opt => toId(opt) === id)

    return {
      isBlank,
      isDisabled: isDisabled || options.length === 0,
      isInvalid: value == null && !isBlank,
      isOpen,
      query: '',
      selection: isBlank ? [] : [id],
      value
    }
  }

  get classes() {
    return ['select', 'form-control', this.props.className, {
      'disabled': this.state.isDisabled,
      'focus': this.state.hasFocus,
      'invalid': this.state.isInvalid,
      'open': this.state.isOpen,
      'static': this.props.isStatic,
      'tab-focus': this.state.hasTabFocus
    }]
  }

  get canClearValue() {
    return !this.props.isRequired && this.props.value != null
  }

  get isInputHidden() {
    return this.props.isInputHidden ||
      this.props.options.length < this.props.minFilterOptions
  }

  clear() {
    this.props.onChange(null, this.props.value != null)
  }

  close() {
    this.setState({ isOpen: this.props.isStatic, query: '' })
  }

  commit() {
    if (this.completions != null) return this.completions.select()
    if (this.state.isBlank) return this.open()

    let { options, toId, value: id } = this.props
    let value = options.find(opt => toId(opt) === id)

    if (value == null) return this.open()
    this.props.onChange(value, false)
  }

  delegate(cmd, ...args) {
    if (this.completions == null) this.open()
    else this.completions[cmd](...args)
  }

  focus = () => {
    this.input && this.input.focus()
  }

  open() {
    if (!this.state.isDisabled) {
      this.setState({ isOpen: true })
    }
  }

  handleBlur = (event) => {
    this.close()
    this.setState({ hasFocus: false, hasTabFocus: false })
    this.props.onBlur(event)
  }

  handleClearButtonClick = (event) => {
    if (event.button === 0) {
      this.clear()
      event.stopPropagation()
    }
  }

  handleFocus = (event) => {
    if (!this.state.hasFocus) {
      this.setState({ hasFocus: true })
      this.props.onFocus(event)
    }
  }

  handleKeyDown = (event) => {
    if (this.props.onKeyDown(event) !== true) {
      switch (event.key) {
        case 'ArrowDown':
          this.delegate('next')
          break
        case 'ArrowUp':
          this.delegate('prev')
          break
        case 'Enter':
          this.commit()
          break
        case 'PageDown':
          this.delegate('next', this.props.maxRows)
          break
        case 'PageUp':
          this.delegate('prev', this.props.maxRows)
          break
        case 'Home':
          this.delegate('first')
          break
        case 'End':
          this.delegate('last')
          break
        case 'Escape':
          this.close()
          break
        default:
          return false
      }
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
    return true
  }

  handleMouseDown = (event) => {
    if (event.button === 0) {
      this.open()
    }
    if (this.input != null) {
      this.input.focus()
      event.preventDefault()
    }
  }

  handleQueryChange = (event) => {
    this.setState({ isOpen: true, query: event.target.value })
  }

  handleSelect = (value) => {
    this.close()
    if (!blank(value)) {
      this.props.onChange(
        value,
        this.props.value != null && this.props.value !== this.props.toId(value)
      )
    }
  }

  handleTabFocus = () => {
    this.setState({ hasTabFocus: true })
  }

  setContainer = (container) => {
    this.container = container
  }

  setCompletions = (completions) => {
    this.completions = completions
  }

  setInput = (input) => {
    if (input != null) {
      on(input, 'tab:focus', this.handleTabFocus)
    }
    if (this.input != null) {
      off(this.input, 'tab:focus', this.handleTabFocus)
    }
    this.input = input
  }

  renderContent() {
    if (this.state.query.length > 0) {
      return null
    }

    if (this.state.isBlank) {
      return (
        <div className="placeholder">{this.props.placeholder}</div>
      )
    }

    return (
      <div className="value">
        {this.state.isInvalid ?
          this.props.value :
          (this.props.toValue || this.props.toText)(this.state.value)}
        {this.canClearValue &&
          <Button
            className="clear"
            icon={<IconXSmall/>}
            onMouseDown={this.handleClearButtonClick}/>}
      </div>
    )
  }

  render() {
    let { isInputHidden } = this
    return (
      <div
        className={cx(this.classes)}
        id={this.props.id}
        onMouseDown={this.handleMouseDown}
        ref={this.setContainer}>
        <input
          className="query"
          disabled={this.state.isDisabled}
          onBlur={this.handleBlur}
          onChange={isInputHidden ? null : this.handleQueryChange}
          onFocus={this.handleFocus}
          onKeyDown={this.handleKeyDown}
          ref={this.setInput}
          style={{ opacity: isInputHidden ? 0 : 1 }}
          tabIndex={this.props.tabIndex}
          type="text"
          value={this.state.query}/>
        {this.renderContent()}
        {this.state.isOpen &&
          <Completions
            className={this.props.className}
            completions={this.props.options}
            hideSelection={this.props.hideSelection}
            isVisibleWhenBlank
            match={this.props.match}
            maxRows={this.props.maxRows}
            onSelect={this.handleSelect}
            parent={this.container}
            popup={!this.props.isStatic}
            query={this.state.query}
            ref={this.setCompletions}
            selection={this.state.selection}
            toId={this.props.toId}
            toText={this.props.toText}/>}
      </div>
    )
  }

  static propTypes = {
    className: string,
    hideSelection: bool,
    id: string,
    isDisabled: bool,
    isInputHidden: bool,
    isRequired: bool,
    isStatic: bool,
    match: func,
    maxRows: number,
    minFilterOptions: number.isRequired,
    options: array.isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onFocus: func.isRequired,
    onKeyDown: func.isRequired,
    onValidate: func.isRequired,
    placeholder: node,
    tabIndex: number,
    toId: func.isRequired,
    toText: func.isRequired,
    toValue: func,
    value: string
  }

  static defaultProps = {
    isStatic: false,
    minFilterOptions: 5,
    onBlur: noop,
    onChange: noop,
    onFocus: noop,
    onKeyDown: noop,
    onValidate: noop,
    toId: (value) => (value.id || String(value)),
    toText: (value) => (value.name || String(value))
  }
}

module.exports = {
  Select
}
