'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { DragLayer } = require('react-dnd')
const { ItemDragPreview } = require('../item')
const { DND } = require('../../constants')


class ProjectDragLayer extends Component {

  get position() {
    const { x, y } = this.props.offset

    return {
      transform: `translate(${x}px, ${y}px)`
    }
  }

  renderItem() {
    const { item, type } = this.props

    switch (type) {
      case DND.ITEM:
        return <ItemDragPreview item={item}/>

      default:
        throw new Error(`unknown dnd type "${type}"`)
    }
  }

  render() {
    if (!this.props.isDragging) return null

    return (
      <div id="project-drag-layer" className="drag-layer">
        <div className="drag-preview-positioner" style={this.position}>
          {this.renderItem()}
        </div>
      </div>
    )
  }

  static propTypes = {
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
