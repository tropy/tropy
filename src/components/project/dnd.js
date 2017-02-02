'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { DragLayer, DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { extname } = require('path')
const { ItemDragPreview } = require('../item')
const { PhotoDragPreview } = require('../photo')
const { DND } = require('../../constants')


class ProjectDragLayer extends Component {
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


const spec = {
  drop({ onDropProject, onDropImages }, monitor) {
    const { files } = monitor.getItem()
    const images = []

    for (let file of files) {
      if (extname(file.path) === '.tpy') {
        return onDropProject(file.path), { project: file.path }
      }

      if (file.type === 'image/jpeg') {
        images.push(file.path)
      }
    }

    if (images.length) {
      return onDropImages(images), { images }
    }
  }
}

const collect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
})

module.exports = {

  DragLayer: DragLayer((monitor) => ({
    item: monitor.getItem(),
    type: monitor.getItemType(),
    offset: monitor.getClientOffset(),
    isDragging: monitor.isDragging()
  }))(ProjectDragLayer),

  connect({ dt }, element) {
    return dt(element)
  },

  wrap(component) {
    return DropTarget(NativeTypes.FILE, spec, collect)(component)
  }
}
