'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const { ItemDragSource } = require('./drag-source')
const { getEmptyImage } = require('react-dnd-html5-backend')
const { meta } = require('../../common/os')
const cn = require('classnames')


class ItemTile extends Component {

  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(this.props.item, event)
  }

  handleClick = (event) => {
    const { item, isSelected, onSelect } = this.props
    const mod = meta(event)

    if (mod) {
      onSelect(item.id, isSelected ? 'remove' : 'merge')

    } else {
      if (!isSelected) {
        onSelect(item.id, 'replace')
      }
    }
  }

  handleDoubleClick = () => {
    const { item, onOpen } = this.props
    onOpen({ id: item.id, photos: item.photos })
  }

  get style() {
    const height = `${this.props.size * 1.25}px`

    return {
      height, flexBasis: height
    }
  }

  get classes() {
    return {
      'item-tile': true,
      'active': this.props.isSelected,
      'dragging': this.props.isDragging
    }
  }

  render() {
    const { ds, ...props } = this.props

    return ds(
      <li
        className={cn(this.classes)}
        style={this.style}
        onContextMenu={this.handleContextMenu}>
        <CoverImage {...props}
          onClick={this.handleClick}
          onDoubleClick={this.handleDoubleClick}/>
      </li>
    )
  }

  static propTypes = {
    size: PropTypes.number.isRequired,
    cache: PropTypes.string.isRequired,
    isSelected: PropTypes.bool,
    item: PropTypes.shape({
      id: PropTypes.number.isRequired
    }),

    isDragging: PropTypes.bool,

    ds: PropTypes.func.isRequired,
    dp: PropTypes.func.isRequired,

    onOpen: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func.isRequired
  }
}

module.exports = {
  ItemTile: ItemDragSource()(ItemTile)
}
