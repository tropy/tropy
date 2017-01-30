'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const { getEmptyImage } = require('react-dnd-html5-backend')
const { meta } = require('../../common/os')
const cn = require('classnames')
const dnd = require('./dnd')


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

    event.stopPropagation()

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
      'dragging': this.props.isDragging,
      'over': this.props.isOver
    }
  }

  render() {
    const { onClick, ...props } = this.props

    return dnd.connect(this.props, (
      <li
        className={cn(this.classes)}
        style={this.style}
        onContextMenu={this.handleContextMenu}>
        <CoverImage {...props}
          onClickInside={onClick}
          onClick={this.handleClick}
          onDoubleClick={this.handleDoubleClick}/>
      </li>
    ))
  }

  static propTypes = {
    size: PropTypes.number.isRequired,
    cache: PropTypes.string.isRequired,
    selection: PropTypes.arrayOf(PropTypes.number),
    item: PropTypes.shape({
      id: PropTypes.number.isRequired
    }),

    isSelected: PropTypes.bool,
    isDragging: PropTypes.bool,
    isOver: PropTypes.bool,

    ds: PropTypes.func.isRequired,
    dp: PropTypes.func.isRequired,
    dt: PropTypes.func.isRequired,

    onClick: PropTypes.func,
    onOpen: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func.isRequired,
    onPhotosMove: PropTypes.func
  }
}

module.exports = {
  ItemTile: dnd.wrap(ItemTile)
}
