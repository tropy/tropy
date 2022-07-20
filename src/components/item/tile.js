import React from 'react'
import { bool, number } from 'prop-types'
import { ItemIterable } from './iterable'
import { CoverImage } from './cover-image'
import cx from 'classnames'


class ItemTile extends ItemIterable {
  render() {
    return this.connect(
      <li
        ref={this.setContainer}
        className={cx(this.classes, 'tile', { last: this.props.isLast })}>
        <div className="tile-state">
          <CoverImage
            item={this.props.item}
            photos={this.props.photos}
            tags={this.props.tags}
            size={this.props.size}
            onMouseDown={this.handleMouseDown}
            onClick={this.handleClick}
            onDoubleClick={this.handleOpen}
            onContextMenu={this.handleContextMenu}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    ...ItemIterable.propTypes,
    isLast: bool,
    size: number.isRequired
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
