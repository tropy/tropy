'use strict'

const React = require('react')
const ReactDnD = require('react-dnd')
const { ItemDragPreview } = require('./item')
const { PhotoDragPreview } = require('./photo')
const { SelectionDragPreview } = require('./selection')
const { ListDragPreview } = require('./list')
const { DND } = require('../constants')
const { bool, number, object, shape, string } = require('prop-types')


class DragLayer extends React.Component {
  get position() {
    return (!this.props.offset) ? null : {
      transform: `translate(${this.props.offset.x}px, ${this.props.offset.y}px)`
    }
  }

  renderItemPreview() {
    let { item, type, ...props } = this.props

    switch (type) {
      case DND.ITEMS:
        return <ItemDragPreview {...props} items={item.items}/>
      case DND.PHOTO:
        return <PhotoDragPreview {...props} items={[item]}/>
      case DND.SELECTION:
        return <SelectionDragPreview {...props} items={[item]}/>
      case DND.LIST:
        return <ListDragPreview list={item}/>
    }
  }

  render() {
    let { type, isDragging } = this.props
    let preview = isDragging && type && this.renderItemPreview()

    return (!preview) ? null : (
      <div id="project-drag-layer" className="drag-layer">
        <div className="drag-preview-positioner" style={this.position}>
          {preview}
        </div>
      </div>
    )
  }

  static propTypes = {
    cache: string.isRequired,
    isDragging: bool,
    item: object,
    offset: shape({
      x: number.isRequired,
      y: number.isRequired
    }),
    tags: object.isRequired,
    type: string,
  }
}

module.exports = {
  DragLayer: ReactDnD.DragLayer((monitor) => ({
    item: monitor.getItem(),
    type: monitor.getItemType(),
    offset: monitor.getClientOffset(),
    isDragging: monitor.isDragging()
  }))(DragLayer)
}
