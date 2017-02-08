'use strict'

const React = require('react')
//const { PropTypes } = React
const { PhotoIterable } = require('./iterable')
const { createClickHandler } = require('../util')
const cn = require('classnames')


class PhotoTile extends PhotoIterable {

  get classes() {
    return {
      ...super.classes, tile: true
    }
  }

  get style() {
    const height = `${this.props.size * 1.25}px`

    return {
      height, flexBasis: height
    }
  }

  handleClick = createClickHandler({
    onClick: (event) => {
      event.stopPropagation()
      this.props.onSelect(this.props.photo, event)
    },

    onDoubleClick: (event) => {
      event.stopPropagation()
      this.props.onItemOpen(this.props.photo)
    }
  })

  render() {
    return this.connect(
      <li
        className={cn(this.classes)}
        ref={this.setContainer}
        style={this.style}
        onClick={this.props.onClickOutside}>
        {this.renderThumbnail({
          onClick: this.handleClick,
          onContextMenu: this.handleContextMenu
        })}
      </li>
    )
  }

  static propTypes = {
    ...PhotoIterable.propTypes
  }
}


module.exports = {
  PhotoTile: PhotoTile.wrap()
}
