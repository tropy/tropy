'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { array, func, bool, string, object, oneOfType } = PropTypes
const cx = require('classnames')
const { on, off } = require('../dom')
const { noop } = require('../common/util')


class DraggableHandle extends PureComponent {
  componentWillUnmount() {
    this.stop()
  }

  handleMouseDown = (event) => {
    if (event.button === 0) {
      this.handleDragStart(event)
    }
  }

  handleDrag = (event) => {
    this.props.onDrag(event)
  }

  handleDragStart() {
    if (this.isDragging) return
    this.isDragging = true

    on(document, 'mousemove', this.handleDrag)
    on(document, 'mouseup', this.handleDragEnd, { capture: true })
    on(document, 'mouseleave', this.handleDragEnd)
    on(window, 'blur', this.handleDragEnd)
  }

  handleDragEnd = (event) => {
    this.stop()

    if (!this.isDragging) return
    this.isDragging = false

    this.props.onDragEnd(event)
  }

  stop() {
    off(document, 'mousemove', this.handleDrag)
    off(document, 'mouseup', this.handleDragEnd, { capture: true })
    off(document, 'mouseleave', this.handleDragEnd)
    off(window, 'blur', this.handleDragEnd)
  }

  render() {
    return (
      <div
        className={cx(this.props.classes)}
        onMouseDown={this.props.isDisabled ? null : this.handleMouseDown}/>
    )
  }

  static propTypes = {
    classes: oneOfType([string, array, object]),
    isDisabled: bool,
    onDrag: func,
    onDragEnd: func,
    onDragStart: func
  }

  static defaultProps = {
    onDrag: noop, onDragEnd: noop, onDragStart: noop
  }
}

module.exports = {
  DraggableHandle
}
