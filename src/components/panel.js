'use strict'

const React = require('react')
const { PureComponent, Children, cloneElement: clone } = React
const { only } = require('./util')
const { Resizable } = require('./resizable')
const cx = require('classnames')
const { bounds } = require('../dom')
const { restrict } = require('../common/util')
const { win32 } = require('../common/os')
const { bool, func, node, arrayOf, number, shape } = require('prop-types')
const { PANEL } = require('../constants/sass')
const { remap } = require('../common/util')
const { round } = require('../common/math')
const throttle = require('lodash.throttle')


class Panel extends PureComponent {
  get classes() {
    return { 'panel-body': true }
  }

  handleToggle = () => {
    this.props.onToggle(this, !this.props.isClosed)
  }

  renderHeader(header, props) {
    const { isClosed, canToggle } = this.props

    return (
      <header
        className="panel-header"
        {...props}
        onDoubleClick={canToggle ? this.handleToggle : null}>
        {clone(header, { isClosed })}
      </header>
    )
  }

  renderBody(body, props) {
    return !this.props.isClosed && (
      <div {...props} className={cx(this.classes)}>
        {body}
      </div>
    )
  }

  render() {
    const [header, ...body] = Children.toArray(this.props.children)

    return (
      <section className="panel">
        {this.renderHeader(header)}
        {this.renderBody(body)}
      </section>
    )
  }

  static propTypes = {
    children: node,
    id: number,
    isClosed: bool,
    canToggle: bool,
    onToggle: func
  }
}


class PanelGroup extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { slots: [], height: 0 }
  }

  componentDidMount() {
    this.ro = new ResizeObserver(this.handleResize)
    this.ro.observe(this.container)
  }

  componentWillUnmount() {
    this.ro.disconnect()
  }

  componentWillReceiveProps(props) {
    if (this.props.slots !== props.slots) {
      this.setState(this.getLayout(props))
    }
  }

  getLayout(props = this.props, height = this.state.height) {
    if (height === 0) return

    const slots = []

    let numClosed = 0
    let numOpen = 0

    for (let i = 0, offset = 0; i < props.slots.length; ++i) {
      let slot = props.slots[i]
      let min

      if (slot.isClosed) {
        min = PANEL.CLOSED_HEIGHT
        numClosed++

      } else {
        min = PANEL.MIN_HEIGHT
      }

      offset = offset + min

      slots.push({
        height: slot.height,
        isClosed: slot.isClosed,
        isDisabled: i < numClosed || i === props.slots.length - 1,
        min,
        upper: offset
      })
    }

    let scale = height - numClosed * PANEL.CLOSED_HEIGHT
    let surplus = height

    for (let i = slots.length - 1, offset = 0; i >= 0; --i) {
      let slot = slots[i]

      if (slot.isClosed) {
        slot.height = round((scale + slot.min) * slot.height / 100)
        surplus = surplus - slot.min

      } else {
        slot.height = round(scale * slot.height / 100)
        surplus = surplus - slot.height
        numOpen++
      }

      slot.isDisabled = slot.isDisabled || numOpen < 1

      slot.lower = offset
      offset = offset + slot.min
    }

    if (surplus !== 0) fixLayout(slots, surplus)

    return { height, slots, canClosePanel: numOpen > 1 }
  }

  getShrinkMapper(by) {
    return (original) => {
      let slot

      try {
        return slot = this.shrink(original, by)

      } finally {
        by = by - (original.height - slot.height)
      }
    }
  }

  getGrowMapper(by) {
    return (original) => {
      let slot

      try {
        return slot = this.grow(original, by)

      } finally {
        by = by - (slot.height - original.height)
      }
    }
  }


  setContainer = (container) => {
    this.container = container
  }


  handleResize = throttle((!win32 ?
    ([e]) => this.update(e.contentRect.height) :
    () => this.update(this.container.clientHeight)
  ), 20)

  update(height) {
    this.setState(this.getLayout(this.props, height))
  }

  handleDragStart = (_, active) => {
    const { top, bottom } = bounds(this.container)
    const { slots } = this.state
    const { upper, lower } = slots[active.props.id]

    this.limits = {
      upper: top + upper,
      lower: bottom - lower
    }

    // Set-up memory effect for second slot only for now!
    if (slots.length > 1) {
      const slot = slots[1]

      if (!slot.isClosed && slot.height >= PANEL.MIN_HEIGHT) {
        const offset = top + slots[0].height

        this.limits.memo = (active.props.id === 0) ?
          offset + slot.height - PANEL.MIN_HEIGHT :
          offset + PANEL.MIN_HEIGHT
      }
    }
  }

  handleDrag = ({ pageY }, active) => {
    const { upper, lower } = this.limits

    const position = restrict(pageY, upper, lower)
    const delta = position - bounds(active.container).bottom

    if (delta === 0) return

    this.setState({
      slots: this.resize(delta, active.props.id, position)
    })
  }

  handleDragStop = () => {
    this.commit()
    this.limits = null
  }

  handleToggle = (panel, close) => {
    const at = panel.props.id
    const slots = close ? this.close(at) : this.open(at)

    this.commit(slots)
  }


  grow(slot, by) {
    return (slot.isClosed || by <= 0) ?  slot : {
      ...slot,
      height: slot.height + by
    }
  }

  shrink(slot, by) {
    if (slot.isClosed || by <= 0 || slot.height <= PANEL.MIN_HEIGHT) {
      return slot
    }

    const height = restrict(slot.height - by, PANEL.MIN_HEIGHT)

    return { ...slot, height }
  }

  resize(delta, at, position) {
    let pivot, head, tail
    const { slots } = this.state

    if (delta > 0) {
      while (at > 0 && slots[at].isClosed) --at

      if (at === 1 && position < this.limits.memo) --at

      pivot = this.grow(slots[at], delta)

      head = slots.slice(0, at)
      tail = slots.slice(at + 1).map(this.getShrinkMapper(delta))

    } else {
      do ++at; while (at < slots.length && slots[at].isClosed)

      if (at === 1 && position > this.limits.memo) ++at

      pivot = this.grow(slots[at], -delta)

      head = remap(slots.slice(0, at), this.getShrinkMapper(-delta))
      tail = slots.slice(at + 1)
    }

    return [...head, pivot, ...tail]
  }

  open(at) {
    const { top, bottom } = bounds(this.container)
    const { slots } = this.state

    const pivot = { ...slots[at], isClosed: false }
    const max = bottom - top - pivot.upper - pivot.lower

    pivot.height = restrict(pivot.height, null, max)

    const shrink = this.getShrinkMapper(pivot.height - PANEL.CLOSED_HEIGHT)

    if (at === 0) {
      return [pivot, ...slots.slice(1).map(shrink)]
    }

    return [
      ...remap(slots.slice(0, at), shrink),
      pivot,
      ...slots.slice(at + 1).map(shrink)
    ]
  }

  close(at) {
    const { slots } = this.state

    const pivot = { ...slots[at], isClosed: true }
    const grow = this.getGrowMapper(pivot.height - PANEL.CLOSED_HEIGHT)

    if (at === 0) {
      return [pivot, ...slots.slice(1).map(grow)]
    }

    return [
      ...remap(slots.slice(0, at), grow),
      pivot,
      ...slots.slice(at + 1).map(grow)
    ]
  }

  commit(slots = this.state.slots) {
    const cc = slots.filter(slot => slot.isClosed).length
    const scale = this.state.height - cc * PANEL.CLOSED_HEIGHT

    this.props.onResize(
      slots.map(({ height, isClosed }) => ({
        isClosed,
        height: round(
          height * 100 / (isClosed ? scale + PANEL.CLOSED_HEIGHT : scale), 100
        )
      }))
    )
  }


  renderPanel = (panel, id) => {
    const { slots, canClosePanel } = this.state
    if (id >= slots.length) return

    let { min, height, isClosed, isDisabled } = slots[id]

    if (isClosed) {
      min = height = PANEL.CLOSED_HEIGHT
    }

    return (
      <Resizable
        key={id}
        id={id}
        edge="bottom"
        min={min}
        value={height}
        isDisabled={isDisabled}
        onDrag={this.handleDrag}
        onDragStart={this.handleDragStart}
        onDragStop={this.handleDragStop}>

        {clone(panel, {
          isClosed,
          id,
          canToggle: isClosed || canClosePanel,
          onToggle: this.handleToggle
        })}
      </Resizable>
    )
  }

  render() {
    return (
      <div className="panel-group">
        <header className="panel-group-header">
          {this.props.header}
        </header>
        <div className="panel-group-body" ref={this.setContainer}>
          {Children.map(this.props.children, this.renderPanel)}
        </div>
      </div>
    )
  }


  static propTypes = {
    children: only(Panel),
    header: node,

    slots: arrayOf(shape({
      height: number.isRequired,
      isClosed: bool
    })).isRequired,

    onResize: func.isRequired
  }
}


function fixLayout(slots, surplus) {
  for (let i = 0; i < slots.length; ++i) {
    if (!slots[i].isClosed) {
      slots[i].height += surplus
      break
    }
  }
}


module.exports = {
  Panel,
  PanelGroup
}
