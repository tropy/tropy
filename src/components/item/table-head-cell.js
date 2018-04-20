'use strict'

const React = require('react')
const { PureComponent } = React
const { Draggable } = require('../draggable')
const { Resizable } = require('../resizable')
const cx = require('classnames')
const { IconChevron7 } = require('../icons')
const { TYPE } = require('../../constants')
const { bool, func, number, string } = require('prop-types')
const { blank, noop } = require('../../common/util')

const MIN_WIDTH = 40

const BlankTableHeadCell = () => (
  <th className="blank"/>
)

class ItemTableHeadCell extends PureComponent {
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
        node="th"
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

  static propTypes = {
    isActive: bool,
    isAscending: bool.isRequired,
    isDragging: bool,
    isFixedColumn: bool,
    isMoving: bool,
    isOver: bool,
    label: string.isRequired,
    maxWidth: number,
    minWidth: number.isRequired,
    position: number,
    type: string.isRequired,
    id: string.isRequired,
    width: number.isRequired,
    onClick: func.isRequired,
    onOrder: func,
    onOrderReset: func,
    onOrderStart: func.isRequired,
    onOrderStop: func,
    onResize: func
  }

  static defaultProps = {
    minWidth: MIN_WIDTH,
    onOrderStart: noop,
    type: TYPE.TEXT
  }
}

module.exports = {
  BlankTableHeadCell,
  ItemTableHeadCell
}
