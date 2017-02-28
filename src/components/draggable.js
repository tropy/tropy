'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const cx = require('classnames')
const { on, off } = require('../dom')
const { noop, pick } = require('../common/util')

const {
  array, func, bool, string, number, object, oneOfType, node
} = PropTypes


class Draggable extends PureComponent {
  componentWillUnmount() {
    this.stop()
  }

  handleMouseDown = (event) => {
    if (this.isDragging) this.stop()
    if (event.button !== 0) return

    this.isDragging = true

    on(document, 'mousemove', this.handleDrag)
    on(document, 'mouseup', this.handleDragStop, { capture: true })
    on(document, 'mouseleave', this.handleDragStop)
    on(window, 'blur', this.handleDragStop)

    if (this.props.onMouseDown) {
      return this.props.onMouseDown(event)
    }

    const { pageX, pageY } = event

    this.delay = setTimeout(() =>
      this.handleDrag({ pageX, pageY }), this.props.delay)
  }

  handleDrag = (event) => {
    this.clear()
    this.props.onDrag(event)
  }

  handleDragStop = (event) => {
    this.stop()

    if (!this.isDragging) return
    this.isDragging = false

    this.props.onDragStop(event)
  }

  clear() {
    if (this.delay) clearTimeout(this.delay)
    this.delay = null
  }

  stop() {
    this.clear()

    off(document, 'mousemove', this.handleDrag)
    off(document, 'mouseup', this.handleDragStop, { capture: true })
    off(document, 'mouseleave', this.handleDragStop)
    off(window, 'blur', this.handleDragStop)
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
    onDragStop: func,
    onMouseDown: func
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
