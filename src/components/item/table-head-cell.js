'use strict'

const React = require('react')
const { PureComponent } = React
const { DragSource, DropTarget } = require('react-dnd')
const { Resizable } = require('../resizable')
const cx = require('classnames')
const { IconChevron7 } = require('../icons')
const { DND, TYPE } = require('../../constants')
const { bool, func, number, string } = require('prop-types')
const { bounds } = require('../../dom')
const { blank } = require('../../common/util')
const { round } = Math

const MIN_WIDTH = 40

const BlankTableHeadCell = () => (
  <th className="blank"/>
)

class ItemTableHeadCell extends PureComponent {
  get classes() {
    return ['metadata-head', this.props.type, {
      blank: blank(this.props.label),
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

  setContainer = (container) => {
    this.container = container
  }

  connect(element) {
    return this.isDragAndDropEnabled ?
      this.props.dt(this.props.ds(element)) :
      element
  }

  handleClick = () => {
    this.props.onClick({
      asc: !this.props.isActive || !this.props.isAscending,
      column: this.props.id
    })
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
        {this.connect(
          <div
            className="th-container"
            onClick={this.handleClick}
            ref={this.setContainer}>
            <div className="label">{this.props.label}</div>
            {this.props.isActive && <IconChevron7/>}
          </div>)}
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

  endDrag: (props, monitor) => {
    if (monitor.didDrop()) props.onOrderStop()
    else props.onOrderReset()
  }
}

const DragSourceCollect = (connect, monitor) => ({
  ds: connect.dragSource(),
  isDragging: monitor.isDragging()
})

const DropTargetSpec = {
  hover: ({ id, onOrder }, monitor, { container }) => {
    const item = monitor.getItem()
    if (item.id === id) return

    const { left, width } = bounds(container)
    const offset = round((monitor.getClientOffset().x - left) / width)

    onOrder(item.id, id, offset)
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
