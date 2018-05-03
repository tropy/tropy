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
    if (!shallow(this.props, props, ['isDisabled', 'options', 'value'])) {
      this.setState(this.getStateFromProps(props))
    }
  }

  componentWillUnmount() {
    if (this.input != null) {
      off(this.input, 'tab:focus', this.handleTabFocus)
    }
  }

  getStateFromProps({ isDisabled, options, toId, value: id } = this.props) {
    let isBlank = blank(id)
    let value = isBlank ?
      null :
      options.find(opt => toId(opt) === id)

    return {
      isDisabled: isDisabled || options.length === 0,
      isInvalid: value == null && !isBlank,
      isOpen: false,
      query: '',
      selection: isBlank ? [] : [id],
      value
    }
  }

  get classes() {
    return ['select', this.props.className, {
      'disabled': this.state.isDisabled,
      'focus': this.state.hasFocus,
      'invalid': this.state.isInvalid,
      'open': this.state.isOpen,
      'tab-focus': this.state.hasTabFocus
    }]
  }

  get content() {
    return this.props.value == null ?
      this.props.placeholder :
      this.state.isInvalid ?
        this.props.value :
        (this.props.toValue || this.props.toText)(this.state.value)
  }

  get canClearValue() {
    return !this.props.isRequired && this.props.value != null
  }

  get isInputHidden() {
    return !this.props.canFilterOptions ||
      this.props.options.length < this.props.minFilterOptions
  }

  clear() {
    this.props.onChange()
  }

  close() {
    this.setState({ isOpen: false, query: '' })
  }

  focus = () => {
    this.input && this.input.focus()
  }

  next() {
    if (this.completions == null) this.open()
    else this.completions.next()
  }

  open() {
    if (!this.state.isDisabled) {
      this.setState({ isOpen: true })
    }
  }

  prev() {
    if (this.completions == null) this.open()
    else this.completions.prev()
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
          this.next()
          break
        case 'ArrowUp':
          this.prev()
          break
        case 'Enter':
          if (this.completions != null) {
            this.completions.select()
          }
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
    this.props.onChange(value)
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

  render() {
    let { canClearValue, isInputHidden } = this

    return (
      <div
        className={cx(this.classes)}
        id={this.props.id}
        onMouseDown={this.handleMouseDown}
        ref={this.setContainer}>
        <span className="select-content">{this.content}</span>
        <input
          className="select-options-filter"
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
        {canClearValue &&
          <Button
            className="select-clear-button"
            icon={<IconXSmall/>}
            onMouseDown={this.handleClearButtonClick}/>}
        {this.state.isOpen &&
          <Completions
            className="select-options"
            completions={this.props.options}
            isVisibleWhenBlank
            match={this.props.match}
            onSelect={this.handleSelect}
            parent={this.container}
            query={this.state.query}
            ref={this.setCompletions}
            selection={this.state.selection}
            toId={this.props.toId}
            toText={this.props.toText}/>}
      </div>
    )
  }

  static propTypes = {
    canFilterOptions: bool.isRequired,
    className: string,
    id: string,
    isDisabled: bool,
    isRequired: bool,
    match: func,
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
    canFilterOptions: true,
    minFilterOptions: 5,
    onBlur: noop,
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
