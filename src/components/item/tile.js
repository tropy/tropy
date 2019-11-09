'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const { number } = PropTypes
const { ItemIterable } = require('./iterable')
const { CoverImage } = require('./cover-image')
const cx = require('classnames')


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

module.exports = {
  ItemTile: ItemTile.wrap()
}
