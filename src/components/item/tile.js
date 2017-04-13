'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const { number } = PropTypes
const { ItemIterable } = require('./iterable')
const { CoverImage } = require('./cover-image')
const { createClickHandler } = require('../util')
const cx = require('classnames')


class ItemTile extends ItemIterable {
  get classes() {
    return {
      ...super.classes,
      'tile': true,
      'click-catcher': true
    }
  }

  handleMouseDown = createClickHandler({
    onClick: this.handleSelect,
    onDoubleClick: this.handleOpen
  })

  render() {
    const { item, cache, photos, size } = this.props

    return this.connect(
      <li
        ref={this.setContainer}
        className={cx(this.classes)}>
        <div className="tile-state">
          <CoverImage
            cache={cache}
            item={item}
            photos={photos}
            size={size}
            onMouseDown={this.handleMouseDown}
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
