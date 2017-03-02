'use strict'

const React = require('react')
const { PureComponent, PropTypes, Children, cloneElement: clone } = React
const { only } = require('./util')
const { Resizable } = require('./resizable')
const cx = require('classnames')
const { bounds } = require('../dom')
const { bool, func, node, arrayOf, number, shape } = PropTypes
const { PANEL } = require('../constants/style')


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
    this.state = this.getLayout(props)
  }

  componentWillReceiveProps(props) {
    if (this.props.slots !== props.slots) {
      this.setState(this.getLayout(props))
    }
  }


  getLayout(props) {
    let flex
    let open = 0
    let offset = 0
    let slots = []

    for (let i = props.slots.length - 1; i >= 0; --i) {
      const { height, isClosed } = props.slots[i]

      let value
      let min
      let isRelative = true

      if (isClosed) {
        min = value = PANEL.CLOSED
        isRelative = false

      } else {
        min = PANEL.MIN
        value = height

        ++open
        flex = flex || i
      }

      slots.unshift({
        offset, min, height: value, isClosed, isRelative
      })

      offset = offset + min
    }

    return { slots, flex, canClosePanel: open > 1  }
  }

  get isFlexValid() {
    return bounds(this.flex.container).height > PANEL.MIN
  }

  getMax = () => this.max

  setContainer = (container) => {
    this.container = container
  }

  setFlex = (flex) => {
    this.flex = flex
  }

  handleResizeStart = (_, resizable) => {
    const { top } = bounds(resizable.container)
    const { bottom } = bounds(this.container)
    const { offset } = this.state.slots[resizable.props.id]

    this.max = bottom - top - offset
  }

  handleResize = (height, _, resizable) => {
    if (height <= resizable.state.value) return false
    if (this.isFlexValid) return false

    let act = resizable.props.id
    let cur = this.flex.props.id
    let nxt = cur

    do --nxt; while (nxt > act && this.state.slots[nxt].isClosed)

    if (nxt > act || this.state.slots[cur].isRelative) {
      const slots = [...this.state.slots]

      slots[act] = { ...slots[act], height }
      slots[cur] = { ...slots[cur], height: PANEL.MIN, isRelative: false }

      this.setState({ flex: nxt, slots })
    }

    return true
  }

  handleResizeStop = (height, resizable) => {
    this.max = null

    const scale = bounds(this.container).height / 100

    this.props.onResize(
      this.state.slots.map((slot, id) => {
        if (id === resizable.props.id) {
          return { height, isClosed: slot.isClosed }
        }

        if (!slot.isRelative) {
          return { height: slot.height / scale, isClosed: slot.isClosed }
        }

        return { height: slot.height, isClosed: slot.isClosed }
      })
    )
  }


  renderPanel = (panel, id) => {
    const { min, height, isClosed, isRelative } = this.state.slots[id]
    const isFlex = (this.state.flex === id)

    return (
      <Resizable
        key={id}
        id={id}
        ref={isFlex ? this.setFlex : null}
        edge="bottom"
        min={min}
        max={this.getMax}
        value={isFlex ? null : height}
        isDisabled={isClosed || isFlex}
        isRelative={isRelative}
        onResize={this.handleResize}
        onResizeStart={this.handleResizeStart}
        onResizeStop={this.handleResizeStop}>

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
