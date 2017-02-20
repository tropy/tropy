'use strict'

const React = require('react')
const { PhotoIterable } = require('./iterable')
const { createClickHandler } = require('../util')
const cx = require('classnames')
const { bool } = React.PropTypes


class PhotoTile extends PhotoIterable {
  get classes() {
    return {
      ...super.classes,
      'tile': true,
      'click-catcher': true,
      'small': this.props.isSmall
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
    isSmall: bool
  }
}


module.exports = {
  PhotoTile: PhotoTile.wrap()
}
