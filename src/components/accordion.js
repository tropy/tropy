'use strict'

const React = require('react')
const { Component, Children, cloneElement: clone } = React
const { only } = require('./util')
const cx = require('classnames')
const { on, off, visible } = require('../dom')
const { bool, func, node, number, oneOfType, string } = require('prop-types')


class Accordion extends Component {
  componentDidUpdate({ isActive: wasActive, isOpen: wasOpen }) {
    const { isActive, isOpen } = this.props
    if (isActive && (!wasActive || isOpen && !wasOpen)) {
      if (!visible(this.container)) {
        this.container.scrollIntoView({ block: 'start' })
      }
    }
  }

  get classes() {
    return ['panel', {
      active: this.props.isActive,
      closed: !this.props.isOpen
    }]
  }

  close = () => {
    if (this.props.isOpen) {
      this.props.onToggle(this, false)
    }
  }

  handleToggle = () => {
    this.props.onToggle(this, !this.props.isOpen)
  }

  open = () => {
    if (!this.props.isOpen) {
      this.props.onToggle(this, true)
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  renderHeader(header) {
    return (
      <header
        className="panel-header"
        onClick={this.props.canToggle ? this.handleToggle : null}>
        {header}
      </header>
    )
  }

  renderBody(body) {
    return this.props.isOpen && (
      <div className="panel-body">{body}</div>
    )
  }

  render() {
    const [header, ...body] = Children.toArray(this.props.children)

    return (
      <section
        className={cx(this.classes, this.props.className)}
        ref={this.setContainer}>
        {this.renderHeader(header)}
        {this.renderBody(body)}
      </section>
    )
  }

  static propTypes = {
    canToggle: bool,
    children: node,
    className: string,
    id: oneOfType([number, string]).isRequired,
    isActive: bool,
    isOpen: bool,
    onToggle: func
  }

  static defaultProps = {
    canToggle: true
  }
}


class AccordionGroup extends Component {
  state = {
    active: null,
    hasTabFocus: false,
    open: []
  }

  componentDidMount() {
    on(this.container, 'tab:focus', this.handleTabFocus)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleTabFocus)
  }

  get classes() {
    return ['panel-group', 'accordion', this.props.className, {
      'tab-focus': this.state.hasTabFocus
    }]
  }

  isActive(id = this.state.active) {
    return id != null && id === this.state.active
  }

  isOpen(id = this.state.open) {
    return id != null && this.state.open.includes(id)
  }

  getNext(k = 1) {
    let accordions = Children.toArray(this.props.children)
    let { active } = this.state

    if (accordions.length === 0) return null
    if (active == null) return accordions[0].props.id

    let idx = accordions.findIndex(acc => active === acc.props.id)
    if (idx < 0) return accordions[0].props.id
    idx = (idx + k + accordions.length) % accordions.length
    return accordions[idx].props.id
  }

  getPrev(k = 1) {
    return this.getNext(-k)
  }

  next(k = 1) {
    this.setState({ active: this.getNext(k) })
  }

  prev(k = 1) {
    this.setState({ active: this.getPrev(k) })
  }

  close(id = this.state.open) {
    if (this.isOpen(id)) {
      this.setState({
        active: id,
        open: this.state.open.filter(x => x !== id)
      })
    }
  }

  open(id = this.state.active) {
    if (!this.isOpen(id)) {
      this.setState({
        active: id,
        open: this.props.autoclose ? [id] : [...this.state.open, id]
      })
    }
  }

  toggle(id = this.state.active) {
    if (this.isOpen(id)) this.close(id)
    else this.open(id)
  }

  handleBlur = () => {
    this.setState({ hasTabFocus: false })
  }

  handleFocus = () => {
    this.next(0)
  }

  handleTabFocus = () => {
    this.setState({ hasTabFocus: true })
  }

  handleKeyDown = (event) => {
    if (this.props.tabIndex == null) return

    switch (event.key) {
      case 'ArrowDown':
        this.next()
        break
      case 'ArrowUp':
        this.prev()
        break
      case 'ArrowRight':
        if (event.target === this.container) this.open()
        break
      case ' ':
      case 'Enter':
        if (event.target === this.container) this.toggle()
        break
      case 'ArrowLeft':
      case 'Escape':
        if (event.target === this.container) this.close(this.state.active)
        break
      default:
        return
    }

    this.handleTabFocus()

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleToggle = (accordion, shouldOpen) => {
    if (shouldOpen) this.open(accordion.props.id)
    else this.close(accordion.props.id)
  }

  setContainer = (container) => {
    this.container = container
  }

  render() {
    return (
      <div
        className={cx(this.classes)}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}
        tabIndex={this.props.tabIndex}
        ref={this.setContainer}>
        {Children.map(this.props.children, (acc) =>
          clone(acc, {
            isActive: this.isActive(acc.props.id),
            isOpen: this.isOpen(acc.props.id),
            onToggle: this.handleToggle
          }))}
      </div>
    )
  }

  static propTypes = {
    autoclose: bool,
    children: only(Accordion),
    className: string,
    tabIndex: number
  }
}

module.exports = {
  Accordion,
  AccordionGroup
}
