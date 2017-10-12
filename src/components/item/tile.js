'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const { number } = PropTypes
const { ItemIterable } = require('./iterable')
const { CoverImage } = require('./cover-image')
const cx = require('classnames')


class ItemTile extends ItemIterable {
  render() {
    const { item, cache, photos, size, tags, isSelected } = this.props

    return this.connect(
      <li
        ref={this.setContainer}
        className={cx(this.classes, 'tile', 'click-catcher')}>
        <div className="tile-state">
          <CoverImage
            cache={cache}
            item={item}
            photos={photos}
            tags={tags}
            size={size}
            onMouseDown={isSelected ? null : this.handleSelect}
            onClick={isSelected ? this.handleSelect : null}
            onDoubleClick={this.handleOpen}
            onContextMenu={this.handleContextMenu}/>
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

module.exports = {
  ItemTile: ItemTile.wrap()
}
