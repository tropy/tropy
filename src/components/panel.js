'use strict'

const React = require('react')
const { PureComponent, PropTypes, Children, cloneElement: clone } = React
const { only } = require('./util')
const { Resizable } = require('./resizable')
const cx = require('classnames')
const { bounds } = require('../dom')
const { bool, func, node, arrayOf, number, shape } = PropTypes
const { PANEL } = require('../constants/sass')


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
        min = value = PANEL.CLOSED_HEIGHT
        isRelative = false

      } else {
        min = PANEL.MIN_HEIGHT
        value = height

        ++open
        flex = flex || i
      }

      slots.unshift({
        offset, min, height: value, isClosed, isRelative
      })

      offset = offset + min
    }

    return { slots, flex, canClosePanel: open > 1, max: null  }
  }

  get isFlexValid() {
    return bounds(this.flex.container).height > PANEL.MIN_HEIGHT
  }

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

    this.setState({
      max: bottom - top - offset
    })
  }

  handleResize = (height, _, resizable) => {
    const slots = [...this.state.slots]
    const { id } = resizable.props

    const dir = height - slots[id].height

    slots[id] = { ...slots[id], height }

    let cur = this.state.flex
    let nxt = cur

    if (dir > 0 && !this.isFlexValid) {

      do --nxt; while (nxt > id && slots[nxt].isClosed)

      if (nxt > id || slots[cur].isRelative) {
        slots[cur] = {
          ...slots[cur], height: PANEL.MIN_HEIGHT, isRelative: false
        }
      }
    }

    this.setState({ flex: nxt, slots })
  }

  handleResizeStop = (_, resizable) => {
    const { scale } = resizable

    this.props.onResize(
      this.state.slots.map((slot) => {
        let { height, isClosed, isRelative } = slot

        if (!isRelative) height = height / scale

        return { height, isClosed }
      })
    )
  }


  renderPanel = (panel, id) => {
    const { min, max, height, isClosed, isRelative } = this.state.slots[id]
    const isFlex = (this.state.flex === id)

    return (
      <Resizable
        key={id}
        id={id}
        ref={isFlex ? this.setFlex : null}
        edge="bottom"
        min={min}
        max={max}
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
