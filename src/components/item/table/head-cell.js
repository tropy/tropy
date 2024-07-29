import React from 'react'
import { Draggable } from '../../draggable.js'
import { Resizable } from '../../resizable.js'
import cx from 'classnames'
import { IconChevron7 } from '../../icons.js'
import { TYPE } from '../../../constants/index.js'
import { blank, noop } from '../../../common/util.js'

const MIN_WIDTH = 40

export class TableHeadCell extends React.PureComponent {
  get classes() {
    return ['metadata-head', this.props.type, {
      blank: blank(this.props.label),
      dragging: this.props.isDragging,
      moving: this.props.isMoving,
      [this.direction]: this.props.isActive
    }]
  }

  get direction() {
    return this.props.isAscending ? 'ascending' : 'descending'
  }

  get isResizable() {
    return this.props.onResize != null && this.props.position != null
  }

  handleClick = () => {
    this.props.onClick({
      asc: !this.props.isActive || !this.props.isAscending,
      column: this.props.id
    })
  }

  handleDragStart = (event) => {
    this.props.onOrderStart(this.props.position, event)
  }

  handleDrag = (event) => {
    this.props.onOrder(event)
  }

  handleDragStop = (event, hasBeenCancelled) => {
    if (hasBeenCancelled) {
      this.props.onOrderReset()
    } else {
      this.props.onOrderStop()
    }
  }

  handleResizeStop = () => {
    this.props.onResize({
      column: this.props.position,
      width: this.props.width
    }, true)
  }

  handleResize = ({ value }) => {
    this.props.onResize({
      column: this.props.position,
      width: value
    }, false)
  }

  render() {
    return (
      <Resizable
        className={cx(this.classes)}
        edge="right"
        isDisabled={!this.isResizable}
        max={this.props.maxWidth}
        min={this.props.minWidth}
        onDragStop={this.handleResizeStop}
        onResize={this.handleResize}
        value={this.props.width}>
        <Draggable
          className="th-container"
          delay={600}
          isDisabled={this.props.isFixedColumn}
          onClick={this.handleClick}
          onDragStart={this.handleDragStart}
          onDrag={this.handleDrag}
          onDragStop={this.handleDragStop}>
          <div className="label">{this.props.label}</div>
          {this.props.isActive && <IconChevron7/>}
        </Draggable>
      </Resizable>
    )
  }

  static defaultProps = {
    minWidth: MIN_WIDTH,
    onOrderStart: noop,
    type: TYPE.TEXT
  }
}
