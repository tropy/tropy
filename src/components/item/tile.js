'use strict'

const React = require('react')
const { ItemIterable } = require('./iterable')
const { CoverImage } = require('./cover-image')
const { createClickHandler } = require('../util')
const cn = require('classnames')


class ItemTile extends ItemIterable {

  get classes() {
    return {
      ...super.classes, tile: true
    }
  }

  get style() {
    const height = `${this.props.size * 1.25}px`
    return { height, flexBasis: height }
  }

  handleMouseDown = createClickHandler({
    onClick: this.handleSelect,
    onDoubleClick: this.handleOpen
  })

  render() {
    return this.connect(
      <li className={cn(this.classes)} style={this.style}>
        <CoverImage
          cache={this.props.cache}
          size={this.props.size}
          item={this.props.item}
          onMouseDown={this.handleMouseDown}
          onContextMenu={this.handleContextMenu}/>
      </li>
    )
  }

  static propTypes = {
    ...ItemIterable.propTypes
  }
}

module.exports = {
  ItemTile: ItemTile.wrap()
}
