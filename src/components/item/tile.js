'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const { meta } = require('../../common/os')
const cn = require('classnames')


class ItemTile extends Component {

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
      'active': this.props.isSelected
    }
  }

  render() {
    return (
      <li
        className={cn(this.classes)}
        style={this.style}
        onContextMenu={this.handleContextMenu}>
        <CoverImage {...this.props}
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

    onOpen: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func.isRequired
  }
}

module.exports = {
  ItemTile
}
