import React from 'react'
import { only } from './util'
import cx from 'classnames'
import { visible } from '../dom'
import { bool, func, node, number, oneOfType, string } from 'prop-types'

const { Component, Children, cloneElement: clone } = React

export class Accordion extends Component {
  container = React.createRef()

  componentDidUpdate({ isActive: wasActive, isOpen: wasOpen }) {
    const { isActive, isOpen } = this.props
    if (isActive && (!wasActive || isOpen && !wasOpen)) {
      if (!visible(this.container.current)) {
        this.container.current.scrollIntoView({ block: 'start' })
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
        ref={this.container}>
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


export class AccordionGroup extends Component {
  state = {
    active: null,
    open: []
  }

  get classes() {
    return ['panel-group', 'accordion', this.props.className]
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

  handleFocus = () => {
    this.next(0)
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
        if (event.target === this.container.current) this.open()
        break
      case ' ':
      case 'Enter':
        if (event.target === this.container.current) this.toggle()
        break
      case 'ArrowLeft':
      case 'Escape':
        if (event.target === this.container.current)
          this.close(this.state.active)
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleToggle = (accordion, shouldOpen) => {
    if (shouldOpen) this.open(accordion.props.id)
    else this.close(accordion.props.id)
  }

  render() {
    return (
      <div
        className={cx(this.classes)}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}
        tabIndex={this.props.tabIndex}
        ref={this.container}>
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
