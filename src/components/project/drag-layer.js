'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { DragLayer } = require('react-dnd')
const { ItemDragPreview } = require('../item')
const { DND } = require('../../constants')
const { warn } = require('../../common/log')


class ProjectDragLayer extends Component {

  get position() {
    const { offset } = this.props

    return {
      transform: offset ? `translate(${offset.x}px, ${offset.y}px)` : null
    }
  }

  renderItem() {
    const { item, type, ...props } = this.props

    switch (type) {
      case DND.ITEMS:
        return <ItemDragPreview {...props} items={item.items}/>

      default:
        warn(`unknown dnd type "${type}"`)
    }
  }

  render() {
    if (!this.props.isDragging) return null
    if (!this.props.type !== DND.ITEMS) return null

    return (
      <div id="project-drag-layer" className="drag-layer">
        <div className="drag-preview-positioner" style={this.position}>
          {this.renderItem()}
        </div>
      </div>
    )
  }

  static propTypes = {
    cache: PropTypes.string,
    zoom: PropTypes.number,
    item: PropTypes.object,
    type: PropTypes.string,
    offset: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    }),
    isDragging: PropTypes.bool
  }
}


const collect = (monitor) => ({
  item: monitor.getItem(),
  type: monitor.getItemType(),
  offset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging()
})


module.exports = {
  ProjectDragLayer: DragLayer(collect)(ProjectDragLayer)
}
