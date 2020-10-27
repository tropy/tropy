import React from 'react'
import { number } from 'prop-types'
import { ItemIterable } from './iterable'
import { CoverImage } from './cover-image'
import cx from 'classnames'


class ItemTile extends ItemIterable {
  render() {
    return this.connect(
      <li
        ref={this.setContainer}
        className={cx(this.classes, 'tile', 'click-catcher')}>
        <div className="tile-state">
          <CoverImage
            cache={this.props.cache}
            item={this.props.item}
            photos={this.props.photos}
            tags={this.props.tags}
            size={this.props.size}
            onMouseDown={this.handleMouseDown}
            onClick={this.handleClick}
            onDoubleClick={this.handleOpen}
            onContextMenu={this.handleContextMenu}
            onError={this.props.onPhotoError}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    ...ItemIterable.propTypes,
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
