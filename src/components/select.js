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
    if (!shallow(this.props, props, ['value', 'options'])) {
      this.setState(this.getStateFromProps(props))
    }
  }

  componentWillUnmount() {
    if (this.container != null) {
      off(this.container, 'tab:focus', this.handleTabFocus)
    }
  }

  getStateFromProps({ isDisabled, options, value: id, toId } = this.props) {
    let value = blank(id) ?
      null :
      options.find(opt => toId(opt) === id)

    return {
      isDisabled: isDisabled || options.length === 0,
      isInvalid: value == null && !blank(id),
      isOpen: false,
      query: '',
      value
    }
  }

  get classes() {
    return ['select', this.props.className, {
      'disabled': this.state.isDisabled,
      'invalid': this.state.isInvalid,
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

  get tabIndex() {
    return this.state.isDisabled ? null : this.props.tabIndex
  }

  clear = () => {
    this.props.onChange()
  }

  close() {
    this.setState({ isOpen: false })
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

  handleBlur = () => {
    this.close()
    this.setState({ hasTabFocus: false })
  }

  handleFocus = () => {
  }

  handleKeyDown = (event) => {
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
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
    return
  }

  handleMouseDown = (event) => {
    if (event.button === 0) this.open()
  }

  handleSelect = (value) => {
    this.close()
    this.props.onChange(value)
  }

  handleTabFocus = () => {
    this.setState({ hasTabFocus: true })
  }

  setContainer = (container) => {
    if (container != null) {
      on(container, 'tab:focus', this.handleTabFocus)
    }
    if (this.container != null) {
      off(this.container, 'tab:focus', this.handleTabFocus)
    }
    this.container = container
  }

  setCompletions = (completions) => {
    this.completions = completions
  }

  renderCompletions() {
    return (!this.state.isOpen) ? null : (
      <Completions
        className="select"
        completions={this.props.options}
        onSelect={this.handleSelect}
        parent={this.container}
        query={this.state.query}
        ref={this.setCompletions}
        selection={blank(this.props.value) ? [] : [this.props.value]}
        toId={this.props.toId}
        toText={this.props.toText}/>
    )
  }

  renderClearButton() {
    return (!this.canClearValue) ? null : (
      <Button icon={<IconXSmall/>} onClick={this.clear}/>
    )
  }

  render() {
    return (
      <div
        className={cx(this.classes)}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}
        onMouseDown={this.handleMouseDown}
        ref={this.setContainer}
        tabIndex={this.tabIndex}>
        <div className="select-content">{this.content}</div>
        {this.renderClearButton()}
        {this.renderCompletions()}
      </div>
    )
  }

  static propTypes = {
    className: string,
    isDisabled: bool,
    isRequired: bool,
    options: array.isRequired,
    onBlur: func.isRequired,
    onChange: func.isRequired,
    onFocus: func.isRequired,
    onValidate: func.isRequired,
    placeholder: node,
    tabIndex: number,
    toId: func.isRequired,
    toText: func.isRequired,
    toValue: func,
    value: string
  }

  static defaultProps = {
    onBlur: noop,
    onFocus: noop,
    onValidate: noop,
    toId: (value) => (value.id || String(value)),
    toText: (value) => (value.name || String(value))
  }
}

module.exports = {
  Select
}
