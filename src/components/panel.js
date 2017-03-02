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

      if (isClosed) {
        min = value = PANEL.CLOSED

      } else {
        min = PANEL.MIN
        value = height

        ++open
        flex = flex || i
      }

      slots.unshift({
        offset, min, value, isClosed
      })

      offset = offset + min
    }

    return { slots, flex, canClosePanel: open > 1  }
  }

  getMax = () => this.max

  setContainer = (container) => {
    this.container = container
  }

  handleResizeStart = (_, resizable) => {
    const { top } = bounds(resizable.container)
    const { bottom } = bounds(this.container)
    const { offset } = this.state.slots[resizable.props.id]

    this.max = bottom - top - offset
  }

  handleResizeStop = () => {
    this.max = null
  }

  handleResize = (height, resizable) => {
    // eslint-disable-next-line no-console
    console.log('resize', height, resizable.props.id)
  }

  renderPanel = (panel, id) => {
    const { min, value, isClosed } = this.state.slots[id]
    const isFlex = (this.state.flex === id)

    return (
      <Resizable
        key={id}
        id={id}
        edge="bottom"
        min={min}
        max={this.getMax}
        value={isFlex ? null : value}
        isDisabled={isClosed || isFlex}
        isRelative={!isClosed}
        onResizeStart={this.handleResizeStart}
        onResizeStop={this.handleResizeStop}
        onChange={this.handleResize}>

        {clone(panel, {
          isClosed,
          id,
          canToggle: isClosed || this.state.canClosePanel,
          onToggle: this.props.onPanelToggle
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

    onPanelToggle: func.isRequired,
    onResize: func.isRequired
  }
}

module.exports = {
  Panel,
  PanelGroup
}
