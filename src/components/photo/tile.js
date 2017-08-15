'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const { number } = PropTypes
const { PhotoIterable } = require('./iterable')
const { createClickHandler } = require('../util')
const cx = require('classnames')


class PhotoTile extends PhotoIterable {
  get classes() {
    return {
      ...super.classes,
      'tile': true,
      'click-catcher': true
    }
  }

  handleClick = createClickHandler({
    onClick: this.select,

    onDoubleClick: () => {
      this.props.onItemOpen(this.props.photo)
    }
  })

  render() {
    return this.connect(
      <li
        className={cx(this.classes)}
        ref={this.setContainer}>
        <div className="tile-state">
          {this.renderThumbnail({
            onClick: this.handleClick,
            onContextMenu: this.handleContextMenu
          })}
        </div>
      </li>
    )
  }

  static propTypes = {
    ...PhotoIterable.propTypes,
    size: number.isRequired
  }

  static defaultProps = {
    ...PhotoIterable.defaultProps,
    size: 512
  }
}


module.exports = {
  PhotoTile: PhotoTile.wrap()
}
