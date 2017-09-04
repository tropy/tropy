'use strict'

const React = require('react')
const { PureComponent } = React
const cx = require('classnames')
const { createDragHandler } = require('../dom')
const { noop, pick } = require('../common/util')

const {
  array, func, bool, string, number, object, oneOfType, node
} = require('prop-types')


class Draggable extends PureComponent {
  componentWillUnmount() {
    this.drag.stop()
  }

  handleMouseDown = (event) => {
    if (this.isDragging) this.drag.stop()
    if (event.button !== 0) return

    if (this.props.onDragStart) {
      if (this.props.onDragStart(event)) return
    }

    this.isDragging = true
    this.drag()

    const { pageX, pageY } = event

    this.delay = setTimeout(() =>
      void this.handleDrag({ pageX, pageY }), this.props.delay)
  }

  handleDrag = (event) => {
    this.clear()
    this.props.onDrag(event)
  }

  handleDragStop = (event) => {
    this.clear()
    if (!this.isDragging) return
    this.isDragging = false
    this.props.onDragStop(event)
  }

  drag = createDragHandler({
    handleDrag: this.handleDrag,
    handleDragStop: this.handleDragStop
  })


  clear() {
    if (this.delay) clearTimeout(this.delay)
    this.delay = null
  }

  render() {
    const { children, classes, isDisabled, ...props } = this.props

    return (
      <div {...pick(props, ['tabIndex', 'style'])}
        className={cx(classes)}
        onMouseDown={isDisabled ? null : this.handleMouseDown}>
        {children}
      </div>
    )
  }

  static propTypes = {
    children: node,
    classes: oneOfType([string, array, object]),
    delay: number,
    isDisabled: bool,
    style: object,
    tabIndex: number,
    onDrag: func,
    onDragStart: func,
    onDragStop: func
  }

  static defaultProps = {
    delay: 250,
    onDrag: noop,
    onDragStop: noop
  }
}

module.exports = {
  Draggable
}
