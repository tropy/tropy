'use strict'

const React = require('react')
const { Component, Children, cloneElement: clone } = React
const { only } = require('./util')
const cx = require('classnames')
const { on, off } = require('../dom')
const { bool, func, node, number, string } = require('prop-types')


class Accordion extends Component {
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
      <section className={cx(this.classes, this.props.className)}>
        {this.renderHeader(header)}
        {this.renderBody(body)}
      </section>
    )
  }

  static propTypes = {
    canToggle: bool,
    children: node,
    className: string,
    id: number.isRequired,
    isActive: bool,
    isOpen: bool,
    onToggle: func.isRequired
  }

  static defaultProps = {
    canToggle: true
  }
}


class AccordionGroup extends Component {
  constructor(props) {
    super(props)
    this.state = {
      active: null,
      hasTabFocus: false,
      open: null
    }
  }

  componentDidMount() {
    on(this.container, 'tab:focus', this.handleTabFocus)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleTabFocus)
  }

  componentWillReceiveProps(props) {
    if (props.children !== this.props.children) {
      this.setState({ active: null, open: null })
    }
  }

  get classes() {
    return ['panel-group', 'accordion', this.props.className, {
      'tab-focus': this.state.hasTabFocus
    }]
  }

  get size() {
    return Children.count(this.props.children)
  }

  isActive(id = this.state.active) {
    return id != null && id === this.state.active
  }

  isOpen(id = this.state.open) {
    return id != null && id === this.state.open
  }

  getNext(k = 1) {
    let { size } = this
    return (size === 0) ? null :
      (this.state.active == null) ? 0 :
        (this.state.active + k) % size
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
        active: id % this.size,
        open: null
      })
    }
  }

  open(id = this.state.active) {
    if (!this.isOpen(id)) {
      id = id % this.size
      this.setState({ active: id, open: id })
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
        {Children.map(this.props.children, (acc, id) =>
          clone(acc, {
            id,
            isActive: this.isActive(id),
            isOpen: this.isOpen(id),
            onToggle: this.handleToggle
          }))}
      </div>
    )
  }

  static propTypes = {
    children: only(Accordion),
    className: string,
    tabIndex: number
  }
}

module.exports = {
  Accordion,
  AccordionGroup
}
