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
const { verbose } = require('../common/log')


class Panel extends PureComponent {
  get classes() {
    return { 'panel-body': true }
  }

  handleToggle = () => {
    this.props.onToggle(this.props.id, !this.props.isClosed)
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
    on(window, 'resize', this.resize)
  }

  componentWillUnmount() {
    off(window, 'resize', this.resize)
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
    let open = 0
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
        open++
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
      top, bottom, height, slots, canClosePanel: open > 1
    }
  }


  isLast(id) {
    return id === this.state.slots.length - 1
  }

  resize = () => this.setState(this.getLayout())

  setContainer = (container) => {
    this.container = container
  }

  handleDragStart = (_, active) => {
    let { top, bottom } = this.state
    let { upper, lower } = this.state.slots[active.props.id]

    this.bounds = {
      upper: top + upper,
      lower: bottom - lower
    }
  }


  handleDragUp(delta, active) {
    const slots = this.state.slots.slice(active.props.id + 2)
    const current = this.state.slots[active.props.id + 1]

    slots.unshift({
      ...current, height: current.height + delta
    })

    for (let i = active.props.id; i >= 0; --i) {
      const slot = this.state.slots[i]

      if (delta <= 0 || slot.height <= PANEL.MIN_HEIGHT) {
        slots.unshift(slot)
      } else {
        const height = restrict(slot.height - delta, PANEL.MIN_HEIGHT)
        const diff = slot.height - height

        if (diff === 0) {
          slots.unshift(slot)
        } else {

          delta = delta - diff
          slots.unshift({ ...slot, height })
        }
      }
    }

    return slots
  }

  handleDragDown(delta, active) {
    const slots = this.state.slots.slice(0, active.props.id)
    const current = this.state.slots[active.props.id]

    slots.push({
      ...current, height: current.height + delta
    })

    for (let i = active.props.id + 1; i < this.state.slots.length; ++i) {
      const slot = this.state.slots[i]

      if (delta <= 0 || slot.height <= PANEL.MIN_HEIGHT) {
        slots.push(slot)
      } else {

        const height = restrict(slot.height - delta, PANEL.MIN_HEIGHT)
        const diff = slot.height - height

        if (diff === 0) {
          slots.push(slot)
        } else {

          delta = delta - diff
          slots.push({ ...slot, height })
        }
      }
    }

    return slots
  }

  handleDrag = ({ pageY }, active) => {
    const { upper, lower } = this.bounds

    const position = restrict(pageY, upper, lower)
    const delta = position - bounds(active.container).bottom

    if (delta === 0) return

    this.setState({
      slots: (delta > 0) ?
        this.handleDragDown(delta, active) :
        this.handleDragUp(-delta, active)
    })
  }

  handleDragStop = () => {
    this.props.onResize(
      this.state.slots.map(({ height, isClosed }) => ({
        height: round(height * 100 / this.state.height),
        isClosed
      }))
    )

    this.bounds = null
  }


  renderPanel = (panel, id) => {
    const slot = this.state.slots[id]
    if (!slot) return

    const { min, height, isClosed } = slot
    const isLast = this.isLast(id)

    return (
      <Resizable
        key={id}
        id={id}
        edge="bottom"
        min={min}
        value={isClosed ? PANEL.CLOSED_HEIGHT : height}
        isDisabled={isLast}
        onDrag={this.handleDrag}
        onDragStart={this.handleDragStart}
        onDragStop={this.handleDragStop}>

        {clone(panel, {
          isClosed,
          id,
          canToggle: isClosed || this.state.canClosePanel,
          onToggle: this.props.onToggle
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

    onToggle: func.isRequired,
    onResize: func.isRequired
  }
}

module.exports = {
  Panel,
  PanelGroup
}
