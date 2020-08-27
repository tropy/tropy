import React from 'react'
import { DND, DragLayer } from './dnd'
import { ItemDragPreview } from './item'
import { PhotoDragPreview } from './photo'
import { ListDragPreview } from './list'
import { FieldDragPreview } from './metadata'
import { on, off } from '../dom'
import throttle from 'lodash.throttle'
import { bool, number, object, shape, string } from 'prop-types'

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

const CDL = DragLayer((monitor) => ({
  item: monitor.getItem(),
  type: monitor.getItemType(),
  initialClientOffset: monitor.getInitialClientOffset(),
  initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
  position: monitor.getClientOffset(),
  isDragging: monitor.isDragging()
}))(CustomDragLayer)

export { CDL as DragLayer }
