'use strict'

const React = require('react')
const { PureComponent, PropTypes, Children, cloneElement: clone } = React
const { only } = require('./util')
const { Resizable } = require('./resizable')
const cx = require('classnames')
const { bool, func, node, arrayOf, number, shape } = PropTypes
const { PANEL } = require('../constants/style')


class Panel extends PureComponent {
  get classes() {
    return { 'panel-body': true }
  }

  handleToggle = () => {
    this.props.onToggle(this.props.index)
  }

  renderHeader(header, props) {
    const { isClosed } = this.props

    return (
      <header
        className="panel-header" {...props}
        onDoubleClick={this.handleToggle}>
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
    index: number,
    isClosed: bool,
    onToggle: func
  }
}


class PanelGroup extends PureComponent {
  constructor(props) {
    super(props)
    this.state = this.prepare(props.slots)
  }

  componentWillReceiveProps(props) {
    if (this.props.slots !== props.slots) {
      this.setState = this.prepare(props.slots)
    }
  }

  prepare(slots) {
    let flex
    let open = 0

    slots = slots.map((slot, idx) => {
      if (!slots[idx].isClosed) {
        ++open
        flex = idx
      }

      return slot
    })

    return { slots, flex, canClose: open > 1  }
  }

  canToggle(index) {
    return this.state.slots[index].isClosed || this.state.canClose
  }

  handleResize = (height, index) => {
    // eslint-disable-next-line no-console
    console.log('resize', height, index)
  }

  handleValidate = (height, index) => {
    // eslint-disable-next-line no-console
    console.log('validate', height, index)
    return true
  }

  handleToggle = (index) => {
    if (this.canToggle(index)) {
      const { slots } = this.state

      slots[index] = {
        ...slots[index], isClosed: !slots[index].isClosed
      }

      this.setState(this.prepare(slots))
    }
  }

  renderPanel = (panel, index) => {
    const { height, isClosed } = this.state.slots[index]

    const isFlex = this.state.flex === index
    const value = isClosed ?  PANEL.MIN : (isFlex ?  null : height)

    return (
      <Resizable
        key={index}
        index={index}
        edge="bottom"
        min={PANEL.MIN}
        value={value}
        isDisabled={isClosed || isFlex}
        isRelative={!isClosed}
        onChange={this.handleResize}
        onValidate={this.handleValidate}>
        {clone(panel, { isClosed, index, onToggle: this.handleToggle })}
      </Resizable>
    )
  }

  render() {
    return (
      <div id="panel-group">
        <header className="panel-group-header">
          {this.props.header}
        </header>
        <div className="panel-group-body">
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
