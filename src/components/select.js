'use strict'

const React = require('react')
const { Component } = React
const { Completions } = require('./completions')
const { IconXSmall } = require('./icons')
const { Button } = require('./button')
const { blank, noop, shallow } = require('../common/util')
const { on, off } = require('../dom')
const cx = require('classnames')
const {
  array, arrayOf, bool, func, object, oneOfType, node, number, string
} = require('prop-types')


class Value extends Component {
  handleClearButtonClick = (event) => {
    if (event.button === 0) {
      this.props.onClear(this.props.value)
      event.stopPropagation()
    }
  }

  render() {
    return (
      <div className="value">
        {this.props.label}
        {this.props.hasClearButton &&
          <Button
            className="clear"
            icon={<IconXSmall/>}
            onMouseDown={this.handleClearButtonClick}/>}
      </div>
    )
  }

  static propTypes = {
    hasClearButton: bool,
    label: node.isRequired,
    onClear: func.isRequired,
    value: oneOfType([string, object]).isRequired
  }
}

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
      'isRequired',
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
    isRequired,
    isStatic: isOpen,
    options,
    toId,
    value
  } = this.props) {
    let isBlank = blank(value)
    let isMulti = Array.isArray(value)
    let isInvalid = false
    let values = []
    let selection = isMulti ? value : [value]

    if (!isBlank) {
      for (let id of selection) {
        let v = options.find(opt => toId(opt) === id)
        if (v != null) {
          values.push(v)
        } else {
          values.push(id)
          isInvalid = true
        }
      }
    }

    return {
      canClearValue: !isRequired || isMulti && values.length > 1,
      isBlank,
      isDisabled: isDisabled || options.length === 0,
      isInvalid,
      isMulti,
      isOpen,
      query: '',
      selection,
      values
    }
  }

  get classes() {
    return ['select', 'form-control', this.props.className, {
      'disabled': this.state.isDisabled,
      'focus': this.state.hasFocus,
      'invalid': this.state.isInvalid,
      'multi': this.state.isMulti,
      'open': this.state.isOpen,
      'static': this.props.isStatic,
      'tab-focus': this.state.hasTabFocus
    }]
  }

  get isInputHidden() {
    return this.props.isInputHidden ||
      this.props.options.length < this.props.minFilterOptions
  }

  clear = (value) => {
    this.props.onRemove(value)
    this.props.onChange(null, true)
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
      if (this.state.values.includes(value)) {
        this.props.onRemove(value.id)
        this.props.onChange(value, false)
      } else {
        this.props.onInsert(value.id)
        this.props.onChange(value, true)
      }
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

    if (this.state.isBlank || this.props.isValueHidden) {
      return (
        <div className="placeholder">{this.props.placeholder}</div>
      )
    }

    return (
      <div className="values">
        {this.state.values.map(value =>
          <Value
            hasClearButton={this.state.canClearValue}
            key={value.id || value}
            label={(this.props.toValue || this.props.toText)(value)}
            onClear={this.clear}
            value={value}/>)}
      </div>
    )
  }

  renderInput() {
    let { isInputHidden } = this
    return (
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
    )
  }

  renderCompletions() {
    return this.state.isOpen && (
      <Completions
        className={this.props.className}
        completions={this.props.options}
        isSelectionHidden={this.props.isSelectionHidden}
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
        toText={this.props.toText}/>
    )
  }

  render() {
    return (
      <div
        className={cx(this.classes)}
        id={this.props.id}
        onMouseDown={this.handleMouseDown}
        ref={this.setContainer}>
        {this.renderInput()}
        {this.renderContent()}
        {this.renderCompletions()}
      </div>
    )
  }

  static propTypes = {
    className: string,
    id: string,
    isDisabled: bool,
    isInputHidden: bool,
    isRequired: bool,
    isStatic: bool,
    isSelectionHidden: bool,
    isValueHidden: bool,
    match: func,
    maxRows: number,
    minFilterOptions: number.isRequired,
    options: array.isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onFocus: func.isRequired,
    onInsert: func.isRequired,
    onKeyDown: func.isRequired,
    onRemove: func.isRequired,
    onValidate: func.isRequired,
    placeholder: node,
    tabIndex: number,
    toId: func.isRequired,
    toText: func.isRequired,
    toValue: func,
    value: oneOfType([string, arrayOf(string)])
  }

  static defaultProps = {
    isStatic: false,
    isSelectionHidden: false,
    isValueHidden: false,
    minFilterOptions: 5,
    onBlur: noop,
    onChange: noop,
    onFocus: noop,
    onInsert: noop,
    onKeyDown: noop,
    onRemove: noop,
    onValidate: noop,
    toId: (value) => (value.id || String(value)),
    toText: (value) => (value.name || String(value))
  }
}

module.exports = {
  Select
}
