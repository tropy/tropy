'use strict'

const React = require('react')
const { DND, DragLayer } = require('./dnd')
const { ItemDragPreview } = require('./item')
const { PhotoDragPreview } = require('./photo')
const { ListDragPreview } = require('./list')
const { FieldDragPreview } = require('./metadata')
const { on, off } = require('../dom')
const throttle = require('lodash.throttle')
const { bool, number, object, shape, string } = require('prop-types')

const coords = shape({
  x: number.isRequired,
  y: number.isRequired
})

class CustomDragLayer extends React.Component {
  state = {
    dropEffect: 'none'
  }

  componentDidMount() {
    on(window, 'dragover', this.handleDragOver, { passive: true })
  }

  componentWillUnmount() {
    off(window, 'dragover', this.handleDragOver, { passive: true })
  }

  get offset() {
    let origin = this.props.initialSourceClientOffset
    let cursor = this.props.initialClientOffset

    return {
      x: cursor.x - origin.x,
      y: cursor.y - origin.y
    }
  }

  get style() {
    let { position, item } = this.props

    if (position == null || item == null)
      return null

    let style = {}
    let { x, y } = position

    if (item.position === 'relative') {
      let { offset } = this
      style['--offset-x'] = `${offset.x}px`
      style['--offset-y'] = `${offset.y}px`
      x -= offset.x
      y -= offset.y
    }

    style.transform = `translate(${x}px, ${y}px)`

    return style
  }

  handleDragOver = throttle((event) => {
    let { dropEffect } = event.dataTransfer
    if (dropEffect !== this.state.dropEffect) {
      this.setState({ dropEffect })
    }
  }, 100)

  renderItemPreview() {
    let { item, type, ...props } = this.props

    switch (type) {
      case DND.ITEMS:
        return <ItemDragPreview {...props} items={item.items}/>
      case DND.PHOTO:
        return <PhotoDragPreview {...props} items={[item]}/>
      case DND.SELECTION:
        return <PhotoDragPreview {...props} items={[item]}/>
      case DND.LIST:
        return <ListDragPreview list={item}/>
      case DND.FIELD:
        return <FieldDragPreview {...props} field={item}/>
    }
  }

  render() {
    let { type, isDragging } = this.props
    let preview = isDragging && type && this.renderItemPreview()

    return (!preview) ? null : (
      <div className={`drag-layer on-drop-${this.state.dropEffect}`}>
        <div className="drag-preview-positioner" style={this.style}>
          {preview}
        </div>
      </div>
    )
  }

  static propTypes = {
    cache: string.isRequired,
    isDragging: bool,
    item: object,
    position: coords,
    initialClientOffset: coords,
    initialSourceClientOffset: coords,
    tags: object.isRequired,
    type: string
  }
}

module.exports = {
  DragLayer: DragLayer((monitor) => ({
    item: monitor.getItem(),
    type: monitor.getItemType(),
    initialClientOffset: monitor.getInitialClientOffset(),
    initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
    position: monitor.getClientOffset(),
    isDragging: monitor.isDragging()
  }))(CustomDragLayer)
}
