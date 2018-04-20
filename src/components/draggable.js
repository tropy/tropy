'use strict'

const React = require('react')
const { PureComponent } = React
const { createDragHandler } = require('../dom')
const { noop, pick } = require('../common/util')
const { func, bool, string, number, object, node } = require('prop-types')
const cx = require('classnames')

const DRAG = { START: 1, ACTIVE: 2, NONE: 3 }

class Draggable extends PureComponent {
  componentWillUnmount() {
    this.drag.stop()
  }

  handleMouseDown = (event) => {
    if (this.dragstate > DRAG.NONE) this.drag.stop()
    if (event.button !== 0) return

    if (this.props.isDisabled) {
      this.props.onClick(event)
      return
    }

    if (this.props.onDragStart) {
      if (this.props.onDragStart(event)) return
    }

    this.dragstate = DRAG.START
    this.drag.start()

    const { pageX, pageY, clientX } = event

    if (this.props.delay > 0) {
      this.delay = setTimeout(() =>
        void this.handleDrag({ pageX, pageY, clientX }), this.props.delay)
    }
  }

  handleDrag = (event) => {
    this.dragstate = DRAG.ACTIVE
    this.clear()
    this.props.onDrag(event)
  }

  handleDragStop = (event, hasBeenCancelled) => {
    try {
      switch (this.dragstate) {
        case DRAG.START:
          if (!hasBeenCancelled) {
            this.props.onClick(event)
          }
          this.props.onDragStop(event, true)
          break
        case DRAG.ACTIVE:
          this.props.onDragStop(event, hasBeenCancelled)
          break
      }
    } finally {
      this.clear()
      this.dragstate = DRAG.NONE
    }
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
    return (
      <div {...pick(this.props, ['tabIndex', 'style'])}
        className={cx('draggable', this.props.className)}
        onMouseDown={this.handleMouseDown}>
        {this.props.children}
      </div>
    )
  }

  static propTypes = {
    children: node,
    className: string,
    delay: number.isRequired,
    isDisabled: bool,
    style: object,
    tabIndex: number,
    onClick: func.isRequired,
    onDrag: func.isRequired,
    onDragStart: func.isRequired,
    onDragStop: func.isRequired
  }

  static defaultProps = {
    delay: 250,
    onClick: noop,
    onDrag: noop,
    onDragStop: noop
  }
}

module.exports = {
  Draggable
}
