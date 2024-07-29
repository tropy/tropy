import React from 'react'
import { ItemIterable } from './iterable.js'
import { CoverImage } from './cover-image.js'
import cx from 'classnames'


class ItemTile extends ItemIterable {
  render() {
    return this.connect(
      <li
        ref={this.setContainer}
        className={cx(this.classes, 'tile', { last: this.props.isLast })}>
        <div className="tile-state">
          <CoverImage
            cover={this.props.item.cover}
            photos={this.props.item.photos}
            tags={this.props.item.tags}
            size={this.props.size}
            onMouseDown={this.handleMouseDown}
            onClick={this.handleClick}
            onDoubleClick={this.handleOpen}
            onContextMenu={this.handleContextMenu}/>
        </div>
      </li>
    )
  }

  static defaultProps = {
    ...ItemIterable.defaultProps,
    size: 512
  }
}

const ItemTileContainer = ItemTile.wrap()

export {
  ItemTileContainer as ItemTile
}
