'use strict'

const React = require('react')
const { PureComponent, PropTypes, Children, cloneElement: clone } = React
const { only } = require('./util')
const { Resizable } = require('./resizable')
const cx = require('classnames')
const { bounds, on, off } = require('../dom')
const { restrict } = require('../common/util')
const { bool, func, node, arrayOf, number, shape } = PropTypes
const { PANEL } = require('../constants/sass')
const { round } = Math
const { remap } = require('../common/util')
const { verbose } = require('../common/log')


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
        className="panel-header" {...props}
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
    this.state = { slots: [] }
  }

  componentDidMount() {
    this.setState(this.getLayout())
    on(window, 'resize', this.handleResizeWindow)
  }

  componentWillUnmount() {
    off(window, 'resize', this.handleResizeWindow)
  }

  componentWillReceiveProps(props) {
    if (this.props.slots !== props.slots) {
      this.setState(this.getLayout(props))
    }
  }

  getLayout(props = this.props) {
    const { top, bottom, height } = bounds(this.container)

    const slots = []

    let adj = height
    let offset = 0
    let i = 0

    for (; i < props.slots.length; ++i) {
      let slot = props.slots[i]
      let min
      let pix = round(height * slot.height / 100)

      if (slot.isClosed) {
        min = PANEL.CLOSED_HEIGHT
        adj = adj - min

      } else {
        min = PANEL.MIN_HEIGHT
        adj = adj - pix
      }

      offset = offset + min

      slots.push({
        height: pix,
        isClosed: slot.isClosed,
        min,
        upper: offset
      })
    }

    for (--i, offset = 0; i >= 0; --i) {
      slots[i].lower = offset
      offset = offset + slots[i].min
    }

    if (adj !== 0) {
      if (adj > 2) verbose(`panel-group rounding off by ${adj}`)

      for (i = 0; i < slots.length; ++i) {
        if (!slots[i].isClosed) {
          slots[i].height += adj
          break
        }
      }
    }

    return {
      top, bottom, height, slots
    }
  }

  get canClosePanel() {
    let open = 0

    for (let slot of this.state.slots) {
      if (!slot.isClosed) ++open
    }

    return open > 1
  }

  setContainer = (container) => {
    this.container = container
  }

  handleResizeWindow = () => this.setState(this.getLayout())

  handleDragStart = (_, active) => {
    let { top, bottom, slots } = this.state
    let { upper, lower } = slots[active.props.id]

    this.bounds = {
      upper: top + upper,
      lower: bottom - lower
    }
  }

  handleDrag = ({ pageY }, active) => {
    const { upper, lower } = this.bounds

    const position = restrict(pageY, upper, lower)
    const delta = position - bounds(active.container).bottom

    if (delta === 0) return

    this.setState({
      slots: this.resize(delta, active.props.id)
    })
  }

  handleDragStop = () => {
    this.commit()
    this.bounds = null
  }

  handleToggle = (panel, close) => {
    this.setState({
      slots: close ?
        this.close(panel.props.id) : this.open(panel.props.id)
    })

    //this.commit()
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

  grow(slot, by) {
    return (slot.isClosed || by <= 0) ?  slot : {
      ...slot,
      height: slot.height + by
    }
  }

  shrink(slot, by) {
    return (slot.isClosed || by <= 0 || slot.height <= PANEL.MIN_HEIGHT) ?
      slot : {
        ...slot,
        height: restrict(slot.height - by, PANEL.MIN_HEIGHT)
      }
  }

  resize(delta, at) {
    let by, pivot, head, tail
    const { slots } = this.state

    if (delta > 0) {
      by = delta

      pivot = this.grow(slots[at], by)

      head = slots.slice(0, at)
      tail = slots.slice(at + 1).map(this.getShrinkMapper(by))

    } else {
      by = -delta
      at = at + 1

      pivot = this.grow(slots[at], by)

      head = remap(slots.slice(0, at), this.getShrinkMapper(by))
      tail = slots.slice(at + 1)
    }

    return [...head, pivot, ...tail]
  }

  open(at) {
    const { top, bottom, slots } = this.state

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

    if (!this.canClosePanel) return slots

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

  commit() {
    this.props.onResize(
      this.state.slots.map(({ height, isClosed }) => ({
        height: round(height * 100 / this.state.height),
        isClosed
      }))
    )
  }

  renderPanel = (panel, id) => {
    const { slots } = this.state
    if (id >= slots.length) return

    const { min, height, isClosed } = slots[id]

    return (
      <Resizable
        key={id}
        id={id}
        edge="bottom"
        min={isClosed ? PANEL.CLOSED_HEIGHT : min}
        value={isClosed ? PANEL.CLOSED_HEIGHT : height}
        isDisabled={id === slots.length - 1}
        onDrag={this.handleDrag}
        onDragStart={this.handleDragStart}
        onDragStop={this.handleDragStop}>

        {clone(panel, {
          isClosed,
          id,
          canToggle: isClosed || this.canClosePanel,
          onToggle: this.handleToggle
        })}
      </Resizable>
    )
  }

  render() {
    return (
      <div id="panel-group">
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

module.exports = {
  Panel,
  PanelGroup
}
