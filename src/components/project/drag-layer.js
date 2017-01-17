'use strict'


const React = require('react')
const { Component, PropTypes } = React
const { DragLayer } = require('react-dnd')

class ProjectDragLayer extends Component {

  renderItem() {
  }

  render() {
    const { item, type, isDragging } = this.props

    if (!isDragging) return null

    return (
      <div id="project-drag-layer" className="drag-layer">
        <div>{`${type} ${item.id}`}</div>
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
