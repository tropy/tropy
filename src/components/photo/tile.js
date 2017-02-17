'use strict'

const React = require('react')
const { PhotoIterable } = require('./iterable')
const { createClickHandler } = require('../util')
const cx = require('classnames')
const { bool } = React.PropTypes
const { TILE } = require('../../constants/style')


class PhotoTile extends PhotoIterable {

  get classes() {
    return {
      ...super.classes,
      'tile': true,
      'click-catcher': true,
      'small': this.props.isSmall
    }
  }

  get style() {
    const height = `${this.props.size * TILE.FACTOR}px`

    return {
      height, flexBasis: height
    }
  }

  handleClick = createClickHandler({
    onClick: (event) => {
      this.props.onSelect(this.props.photo, event)
    },

    onDoubleClick: () => {
      this.props.onItemOpen(this.props.photo)
    }
  })

  render() {
    return this.connect(
      <li
        className={cx(this.classes)}
        ref={this.setContainer}
        style={this.style}>
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
    isSmall: bool
  }
}


module.exports = {
  PhotoTile: PhotoTile.wrap()
}
