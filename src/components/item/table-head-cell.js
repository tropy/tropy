'use strict'

const React = require('react')
const { PureComponent } = React
const { DragSource, DropTarget } = require('react-dnd')
const { Resizable } = require('../resizable')
const cx = require('classnames')
const { IconChevron7 } = require('../icons')
const { DND, TYPE } = require('../../constants')
const { bool, func, number, string } = require('prop-types')

const MIN_WIDTH = 40

const BlankTableHeadCell = () => (
  <th className="blank"/>
)

class ItemTableHeadCell extends PureComponent {
  get classes() {
    return ['metadata-head', this.props.type, {
      dragging: this.props.isDragging,
      over: this.props.isOver,
      [this.direction]: this.props.isActive
    }]
  }

  get direction() {
    return this.props.isAscending ? 'ascending' : 'descending'
  }

  get isDragAndDropEnabled() {
    return !this.props.isFixedColumn && this.props.onOrder != null
  }

  get isResizable() {
    return this.props.onResize != null && this.props.position != null
  }

  connectDragSource(element) {
    return this.isDragAndDropEnabled ? this.props.ds(element) : element
  }

  connectDropTarget(element) {
    return this.isDragAndDropEnabled ? this.props.dt(element) : element
  }

  handleClick = () => {
    this.props.onClick({
      asc: !this.props.isActive || !this.props.isAscending,
      column: this.props.id
    })
  }

  handleDragStop = () => {
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
        onDragStop={this.handleDragStop}
        onResize={this.handleResize}
        value={this.props.width}>
        {this.connectDropTarget(this.connectDragSource(
          <div
            className="th-container"
            onClick={this.handleClick}>
            <div className="label">{this.props.label}</div>
            {this.props.isActive && <IconChevron7/>}
          </div>))}
      </Resizable>
    )
  }

  static propTypes = {
    isActive: bool,
    isAscending: bool.isRequired,
    isDragging: bool,
    isFixedColumn: bool,
    isOver: bool,
    label: string.isRequired,
    ds: func.isRequired,
    dt: func.isRequired,
    maxWidth: number,
    minWidth: number.isRequired,
    position: number,
    type: string.isRequired,
    id: string.isRequired,
    width: number.isRequired,
    onClick: func.isRequired,
    onOrder: func,
    onOrderReset: func,
    onOrderStart: func,
    onOrderStop: func,
    onResize: func
  }

  static defaultProps = {
    minWidth: MIN_WIDTH,
    type: TYPE.TEXT
  }
}

const DragSourceSpec = {
  beginDrag: ({ id, onOrderStart }) => (onOrderStart(), { id }),

  endDrag: ({ id, onOrderStop, onOrderReset }, monitor) => {
    if (monitor.didDrop()) onOrderStop(id)
    else onOrderReset(id)
  }
}

const DragSourceCollect = (connect, monitor) => ({
  ds: connect.dragSource(),
  isDragging: monitor.isDragging()
})

const DropTargetSpec = {
  hover: ({ id, onOrder }, monitor) => {
    const item = monitor.getItem()
    if (item.id === id) return

    onOrder(item.id, id)
  },

  drop: ({ id }) => ({ id })
}

const DropTargetCollect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver()
})

module.exports = {
  BlankTableHeadCell,
  ItemTableHeadCell:
    DragSource(DND.COLUMN, DragSourceSpec, DragSourceCollect)(
      DropTarget(DND.COLUMN, DropTargetSpec, DropTargetCollect)(
        ItemTableHeadCell))
}
