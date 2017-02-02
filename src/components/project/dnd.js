'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { DragLayer, DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { extname } = require('path')
const { ItemDragPreview } = require('../item')
const { PhotoDragPreview } = require('../photo')
const { DND } = require('../../constants')
const cn = require('classnames')


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



class ProjectDropTarget extends Component {

  get classes() {
    return {
      'project-drop-zone': true,
      'drop-zone': true,
      'over': this.props.isOver
    }
  }

  render() {
    const { children, connectDropTarget } = this.props

    return connectDropTarget(
      <div className={cn(this.classes)}>
        {children}
      </div>
    )
  }

  static propTypes = {
    children: PropTypes.node,
    isOver: PropTypes.bool,
    connectDropTarget: PropTypes.func,
    onDrop: PropTypes.func
  }
}

module.exports = {

  DragLayer: DragLayer((monitor) => ({
    item: monitor.getItem(),
    type: monitor.getItemType(),
    offset: monitor.getClientOffset(),
    isDragging: monitor.isDragging()
  }))(ProjectDragLayer),


  ProjectDropTarget: DropTarget(
    NativeTypes.FILE, {

      drop(props, monitor) {
        if (monitor.didDrop()) return

        const accepted = { images: [] }

        for (let file of monitor.getItem().files) {
          if (extname(file.path) === '.tpy') {
            accepted.project = file.path
            break
          }

          if (file.type === 'image/jpeg') {
            accepted.images.push(file.path)
          }
        }

        if (accepted.project || accepted.images.length) {
          return props.onDrop(accepted), accepted
        }
      }

    },


    (connect, monitor) => ({
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver()
    })
  )(ProjectDropTarget)
}
