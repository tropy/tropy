'use strict'

const React = require('react')
const { Completions } = require('./completions')
const { IconXSmall, IconXMedium } = require('./icons')
const { Button } = require('./button')
const { blank, last, noop } = require('../common/util')
const { on, off } = require('../dom')
const cx = require('classnames')
const memoize = require('memoize-one')
const {
  array, arrayOf, bool, func, object, oneOfType, node, number, string
} = require('prop-types')


class Value extends React.Component {
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

class Select extends React.Component {
  state = {
    query: '',
    selection: [],
    values: []
  }

  componentDidMount() {
    if (this.props.autofocus) {
      this.focus()
    }
  }

  componentDidUpdate(_, state) {
    if (this.state.isInvalid  !== state.Invalid) {
      this.props.onValidate(!this.state.isInvalid)
    }
  }

  componentWillUnmount() {
    if (this.input != null) {
      off(this.input, 'tab:focus', this.handleTabFocus)
    }
  }

  static getDerivedStateFromProps({
    isRequired,
    options,
    toId,
    value
  }) {
    return getDerivedState(value, options, isRequired, toId)
  }

  get isOpen() {
    return this.state.isOpen || this.props.isStatic
  }

  get isDisabled() {
    return this.props.isDisabled || this.props.options.length === 0
  }

  get classes() {
    return ['select', this.props.className, {
      'can-clear': !this.props.hideClearButton && this.state.canClearValue,
      'disabled': this.isDisabled,
      'focus': this.state.hasFocus,
      'has-icon': this.props.icon != null,
      'invalid': !this.isDisabled && this.state.isInvalid,
      'open': this.isOpen,
      'static': this.props.isStatic,
      'tab-focus': this.state.hasTabFocus,
      'form-control': !this.props.isStatic
    }]
  }

  get isInputHidden() {
    return this.props.isInputHidden ||
      this.props.options.length < this.props.minFilterOptions
  }

  clear = (value) => {
    if (this.state.canClearValue) {
      if (value != null) this.props.onRemove(this.props.toId(value))
      else this.props.onClear()
      this.handleChange(null, !this.state.isBlank)
      this.close({ type: 'clear' })
    }
  }

  close = (event) => {
    this.setState({ isOpen: false, query: '' })
    this.props.onClose(event)
  }

  commit() {
    if (this.completions != null) return this.completions.select()
    if (this.state.isBlank) return this.open()
    let value = last(this.state.values)
    if (value == null || value.id == null) return this.open()
    this.handleChange(value, false)
  }

  delegate(cmd, ...args) {
    if (this.completions == null) this.open()
    else this.completions[cmd](...args)
  }

  focus = () => {
    this.input && this.input.focus()
  }

  open() {
    if (!this.isDisabled) {
      this.shouldPopupFadeIn = !this.state.hasFocus
      this.setState({ isOpen: true })
      this.props.onOpen()
    }
  }

  handleBlur = (event) => {
    this.setState({ hasFocus: false, hasTabFocus: false })
    this.props.onBlur(event)
    this.close(event)
  }

  handleChange = (value, hasChanged) => {
    if (this.props.name != null) {
      value = { [this.props.name]: value }
    }
    this.props.onChange(value, hasChanged)
  }

  handleContextMenu = (event) => {
    if (this.isOpen) {
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
          this.delegate('pageDown')
          break
        case 'PageUp':
          this.delegate('pageUp')
          break
        case 'Home':
          this.delegate('first')
          break
        case 'End':
          this.delegate('last')
          break
        case 'Escape':
          this.close({ type: 'escape' })
          break
        case 'Backspace':
          if (!this.props.canClearByBackspace ||
            this.state.query.length !== 0 ||
            !this.state.canClearValue) {
            return false
          }
          this.clear(last(this.state.values))
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
    if (event.button === 0 && !this.props.isStatic) {
      if (!this.isOpen) this.open()
      else if (this.state.query.length === 0) this.close(event)
    }
    if (this.input != null) {
      this.input.focus()
    }
  }

  handleQueryChange = (event) => {
    this.setState({ isOpen: true, query: event.target.value })
  }

  handleSelect = (value) => {
    if (!blank(value)) {
      let id = this.props.toId(value)
      if (this.state.values.includes(value)) {
        if (this.state.canClearValue) this.props.onRemove(id)
        this.handleChange(value, false)
      } else {
        this.props.onInsert(id)
        this.handleChange(value, true)
      }
      this.close({ type: 'select' })
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
        <div className="placeholder">
          <div className="truncate">
            {this.props.placeholder}
          </div>
        </div>
      )
    }

    return (
      <div className="values">
        {this.state.values.map(value =>
          <Value
            hasClearButton={this.state.isMulti && this.state.canClearValue}
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
        className={cx('query', { live: this.isOpen && !isInputHidden })}
        disabled={this.isDisabled}
        id={this.props.id}
        onBlur={this.handleBlur}
        onChange={isInputHidden ? null : this.handleQueryChange}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}
        ref={this.setInput}
        readOnly={isInputHidden}
        style={{ opacity: isInputHidden ? 0 : 1 }}
        tabIndex={this.props.tabIndex}
        type="text"
        value={this.state.query}/>
    )
  }

  renderClearButton() {
    return !this.props.hideClearButton && this.state.canClearValue && (
      <Button
        className="global-clear"
        icon={<IconXMedium/>}
        onMouseDown={this.clear}/>
    )
  }

  renderCompletions() {
    try {
      return this.isOpen && (
        <Completions
          className={cx(this.props.className, {
            'invalid': this.state.isInvalid,
            'has-icon': this.props.icon != null
          })}
          completions={this.props.options}
          fadeIn={this.shouldPopupFadeIn}
          isSelectionHidden={this.props.isSelectionHidden}
          isVisibleWhenBlank
          match={this.props.match}
          maxRows={this.props.maxRows}
          onClickOutside={this.close}
          onResize={this.props.onResize}
          onSelect={this.handleSelect}
          parent={this.container}
          popup={!this.props.isStatic}
          query={this.state.query}
          ref={this.setCompletions}
          selection={this.state.selection}
          toId={this.props.toId}
          toText={this.props.toText}/>
      )
    } finally {
      this.shouldPopupFadeIn = false
    }
  }

  render() {
    return (
      <div
        className={cx(this.classes)}
        onContextMenu={this.handleContextMenu}
        onMouseDown={this.handleMouseDown}
        ref={this.setContainer}>
        {this.props.icon}
        {this.renderContent()}
        {this.renderInput()}
        {this.renderClearButton()}
        {this.renderCompletions()}
      </div>
    )
  }

  static propTypes = {
    autofocus: bool,
    canClearByBackspace: bool,
    className: string,
    hideClearButton: bool,
    icon: node,
    id: string,
    isDisabled: bool,
    isInputHidden: bool,
    isRequired: bool,
    isStatic: bool,
    isSelectionHidden: bool,
    isValueHidden: bool,
    name: string,
    match: func,
    maxRows: number,
    minFilterOptions: number.isRequired,
    options: array.isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onClear: func.isRequired,
    onClose: func.isRequired,
    onFocus: func.isRequired,
    onInsert: func.isRequired,
    onOpen: func.isRequired,
    onKeyDown: func.isRequired,
    onRemove: func.isRequired,
    onResize: func,
    onValidate: func.isRequired,
    placeholder: node,
    tabIndex: number,
    toId: func.isRequired,
    toText: func.isRequired,
    toValue: func,
    value: oneOfType([string, arrayOf(string)])
  }

  static defaultProps = {
    canClearByBackspace: true,
    hideClearButton: false,
    isStatic: false,
    isSelectionHidden: false,
    isValueHidden: false,
    minFilterOptions: 5,
    onBlur: noop,
    onChange: noop,
    onClear: noop,
    onClose: noop,
    onFocus: noop,
    onInsert: noop,
    onOpen: noop,
    onKeyDown: noop,
    onRemove: noop,
    onValidate: noop,
    toId: Completions.defaultProps.toId,
    toText: Completions.defaultProps.toText
  }
}

const getDerivedState = memoize((value, options, isRequired, toId) => {
  let isBlank = blank(value)
  let isMulti = Array.isArray(value)
  let isInvalid = false
  let values = []
  let selection = isMulti ? value : isBlank ? [] : [value]

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
    canClearValue: !isBlank && (!isRequired || isMulti && values.length > 1),
    isBlank,
    isInvalid,
    isMulti,
    selection,
    values
  }
})


module.exports = {
  Select
}
