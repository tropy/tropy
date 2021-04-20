import React from 'react'
import { only } from './util'
import { Resizable } from './resizable'
import cx from 'classnames'
import { bounds, off, on } from '../dom'
import { restrict } from '../common/util'
import { SASS } from '../constants'
import { remap } from '../common/util'
import { round } from '../common/math'
import throttle from 'lodash.throttle'
import memoize from 'memoize-one'
import { arrayOf, bool, func, node, number, string, shape } from 'prop-types'

const { MIN_HEIGHT, CLOSED_HEIGHT } = SASS.PANEL


export class Panel extends React.PureComponent {
  container = React.createRef()

  state = {
    hasTabFocus: false
  }

  componentDidMount() {
    on(this.container.current, 'tab:focus', this.handleTabFocus)
  }

  componentWillUnmount() {
    off(this.container.current, 'tab:focus', this.handleTabFocus)
  }

  get classes() {
    return ['panel', this.props.className, {
      'closed': this.props.isClosed,
      'nested-tab-focus': this.state.hasTabFocus
    }]
  }

  focus() {
    this.container.current.focus()
  }

  handleBlur = () => {
    this.setState({ hasTabFocus: false })
  }

  handleTabFocus = () => {
    this.setState({ hasTabFocus: true })
  }

  handleToggle = () => {
    if (this.props.canToggle) {
      this.props.onToggle(this, !this.props.isClosed)
    }
  }

  renderHeader(header) {
    return (
      <PanelHeader onDoubleClick={this.handleToggle}>
        {React.cloneElement(header, {
          isClosed: this.props.isClosed,
          isDisabled: this.props.isClosed || header.props.isDisabled
        })}
      </PanelHeader>
    )
  }

  renderBody(body, classes) {
    return !this.props.isClosed && (
      <PanelBody className={cx(classes)}>
        {React.cloneElement(body, {
          onBlur: this.handleBlur,
          onTabFocus: this.handleTabFocus
        })}
      </PanelBody>
    )
  }

  render() {
    let [header, body] = React.Children.toArray(this.props.children)

    return (
      <section
        className={cx(this.classes)}
        ref={this.container}
        tabIndex={this.props.tabIndex}
        onBlur={this.handleBlur}
        onKeyDown={this.props.onKeyDown}>
        {this.renderHeader(header)}
        {this.renderBody(body)}
      </section>
    )
  }

  static propTypes = {
    className: string,
    children: node,
    id: number,
    isClosed: bool,
    canToggle: bool,
    tabIndex: number,
    onKeyDown: func,
    onToggle: func
  }
}

export const PanelBody = (props) => (
  <div className={cx('panel-body', props.className)}>
    {props.children}
  </div>
)

PanelBody.propTypes = {
  children: node,
  className: string
}


export const PanelHeader = (props) => (
  <header
    className="panel-header"
    onDoubleClick={props.onDoubleClick}>
    {props.children}
  </header>
)

PanelHeader.propTypes = {
  children: node,
  onDoubleClick: func
}


export class PanelGroup extends React.Component {
  container = React.createRef()

  state = { slots: [], height: 0 }

  static getDerivedStateFromProps(props, state) {
    if (props.slots !== state.prevPropSlots) {
      return {
        ...getLayout(props.slots, state.height),
        prevPropSlots: props.slots
      }
    }

    return null
  }

  componentDidMount() {
    this.ro = new ResizeObserver(([e]) => {
      this.handleResize(e.contentRect.height)
    })
    this.ro.observe(this.container.current)
  }

  componentWillUnmount() {
    this.ro.unobserve(this.container.current)
    this.ro.disconnect()
    this.ro = null
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


  handleResize = throttle((height) => {
    this.update(height)
  }, 15)

  update(height) {
    this.setState(getLayout(this.props.slots, height))
  }

  handleDragStart = (_, active) => {
    let { top, bottom } = bounds(this.container.current)
    let { slots } = this.state
    let { upper, lower } = slots[active.props.id]

    this.limits = {
      upper: top + upper,
      lower: bottom - lower
    }

    // Set-up memory effect for second slot only for now!
    if (slots.length > 1) {
      let slot = slots[1]

      if (!slot.isClosed && slot.height >= MIN_HEIGHT) {
        let offset = top + slots[0].height

        this.limits.memo = (active.props.id === 0) ?
          offset + slot.height - MIN_HEIGHT :
          offset + MIN_HEIGHT
      }
    }
  }

  handleDrag = ({ pageY }, active) => {
    let { upper, lower } = this.limits

    let position = restrict(pageY, upper, lower)
    let delta = position - bounds(active.container.current).bottom

    if (delta) {
      this.setState({
        slots: this.resize(delta, active.props.id, position)
      })
    }
  }

  handleDragStop = () => {
    this.commit()
    this.limits = null
  }

  handleToggle = (panel, close) => {
    let at = panel.props.id
    let slots = close ? this.close(at) : this.open(at)

    this.commit(slots)
  }


  grow(slot, by) {
    return (slot.isClosed || by <= 0) ?  slot : {
      ...slot,
      height: slot.height + by
    }
  }

  shrink(slot, by) {
    if (slot.isClosed || by <= 0 || slot.height <= MIN_HEIGHT) {
      return slot
    }

    let height = restrict(slot.height - by, MIN_HEIGHT)

    return { ...slot, height }
  }

  resize(delta, at, position) {
    let pivot, head, tail
    let { slots } = this.state

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
    const { top, bottom } = bounds(this.container.current)
    const { slots } = this.state

    const pivot = { ...slots[at], isClosed: false }
    const max = bottom - top - pivot.upper - pivot.lower

    pivot.height = restrict(pivot.height, null, max)

    const shrink = this.getShrinkMapper(pivot.height - CLOSED_HEIGHT)

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
    const grow = this.getGrowMapper(pivot.height - CLOSED_HEIGHT)

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
    const scale = this.state.height - cc * CLOSED_HEIGHT

    this.props.onResize(
      slots.map(({ height, isClosed }) => ({
        isClosed,
        height: round(
          height * 100 / (isClosed ? scale + CLOSED_HEIGHT : scale), 100
        )
      }))
    )
  }

  renderPanel = (panel, id) => {
    if (id >= this.state.slots.length) return

    let { min, height, isClosed, isDisabled } = this.state.slots[id]

    if (isClosed) {
      min = height = CLOSED_HEIGHT
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

        {React.cloneElement(panel, {
          isClosed,
          id,
          canToggle: isClosed || this.state.canClosePanel,
          onToggle: this.handleToggle
        })}
      </Resizable>
    )
  }

  render() {
    return (
      <div className={cx('panel-group', this.props.className)}>
        <header className="panel-group-header">
          {this.props.header}
        </header>
        <div className="panel-group-body" ref={this.container}>
          {React.Children.map(this.props.children, this.renderPanel)}
        </div>
      </div>
    )
  }


  static propTypes = {
    children: only(Panel),
    className: string,
    header: node,
    slots: arrayOf(shape({
      height: number.isRequired,
      isClosed: bool
    })).isRequired,
    onResize: func.isRequired
  }
}


const getLayout = memoize((panels, height) => {
  let slots = []
  let numClosed = 0
  let numOpen = 0

  if (height > 0) {
    for (let i = 0, offset = 0; i < panels.length; ++i) {
      let slot = panels[i]
      let min

      if (slot.isClosed) {
        min = CLOSED_HEIGHT
        numClosed++

      } else {
        min = MIN_HEIGHT
      }

      offset = offset + min

      slots.push({
        height: slot.height,
        isClosed: slot.isClosed,
        isDisabled: i < numClosed || i === panels.length - 1,
        min,
        upper: offset
      })
    }

    let scale = height - numClosed * CLOSED_HEIGHT
    let surplus = height

    for (let i = slots.length - 1, offset = 0; i >= 0; --i) {
      let slot = slots[i]

      slot.isDisabled = slot.isDisabled || numOpen < 1
      slot.lower = offset
      offset = offset + slot.min

      if (slot.isClosed) {
        slot.height = round((scale + slot.min) * slot.height / 100)
        surplus = surplus - slot.min

      } else {
        slot.height = round(scale * slot.height / 100)
        surplus = surplus - slot.height
        numOpen++
      }
    }

    if (surplus !== 0) fixLayout(slots, surplus)
  }

  return { height, slots, canClosePanel: numOpen > 1 }
})

function fixLayout(slots, surplus) {
  for (let i = 0; i < slots.length; ++i) {
    if (!slots[i].isClosed) {
      slots[i].height += surplus
      break
    }
  }
}
