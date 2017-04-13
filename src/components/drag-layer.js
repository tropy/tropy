'use strict'

const React = require('react')
const ReactDnD = require('react-dnd')
const { Component } = React
const PropTypes = require('prop-types')
const { ItemDragPreview } = require('./item')
const { PhotoDragPreview } = require('./photo')
const { DND } = require('../constants')


class DragLayer extends Component {
  get position() {
    const { offset } = this.props

    return {
      transform: offset ? `translate(${offset.x}px, ${offset.y}px)` : null
    }
  }

  renderItemPreview() {
    const { item, type, ...props } = this.props

    switch (type) {
      case DND.ITEMS:
        return <ItemDragPreview {...props} items={item.items}/>

      case DND.PHOTO:
        return <PhotoDragPreview {...props} items={[item]}/>
    }
  }

  render() {
    const { type, isDragging } = this.props
    const preview = isDragging && type && this.renderItemPreview()

    if (!preview) return null

    return (
      <div id="project-drag-layer" className="drag-layer">
        <div className="drag-preview-positioner" style={this.position}>
          {preview}
        </div>
      </div>
    )
  }

  static propTypes = {
    cache: PropTypes.string,

    item: PropTypes.object,
    type: PropTypes.string,
    isDragging: PropTypes.bool,

    offset: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    })
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

