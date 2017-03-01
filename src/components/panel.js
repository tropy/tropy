'use strict'

const React = require('react')
const { PureComponent, PropTypes, Children } = React
const { only } = require('./util')
const { Resizable } = require('./resizable')
const cx = require('classnames')
const { bool, func, node, arrayOf, number, shape } = PropTypes
const { PANEL } = require('../constants/style')


class Panel extends PureComponent {
  get classes() {
    return { 'panel-body': true }
  }

  renderHeader(header, props) {
    return (
      <header className="panel-header" {...props}>
        {header}
      </header>
    )
  }

  renderBody(body, props) {
    return (
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
    children: node
  }
}


class PanelGroup extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      slots: this.prepare(props.slots)
    }
  }

  componentWillReceiveProps(props) {
    if (this.props.slots !== props.slots) {
      this.setState = {
        slots: this.prepare(props.slots)
      }
    }
  }

  prepare(slots) {
    let flex

    slots = slots.map((slot, index) => {
      if (!slot.isClosed) flex = index
      return { ...slot }
    })

    if (flex != null) {
      slots[flex].isFlex = true
    }

    return slots
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

  renderPanel = (panel, index) => {
    const slot = this.state.slots[index]

    const value = slot.isClosed ?
      PANEL.MIN : (slot.isFlex ?  null : slot.height)

    return (
      <Resizable
        key={index}
        index={index}
        edge="bottom"
        min={PANEL.MIN}
        value={value}
        isDisabled={slot.isClosed || slot.isFlex}
        isRelative={!slot.isClosed}
        onChange={this.handleResize}
        onValidate={this.handleValidate}>
        {panel}
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
          {Children.toArray(this.props.children).map(this.renderPanel)}
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
