'use strict'

const React = require('react')
const { PropTypes } = React
const { PhotoIterable } = require('./iterable')
const cn = require('classnames')


class PhotoTile extends PhotoIterable {

  handleClick = () => {
    this.props.onClick(this.props.photo)
  }

  handleDoubleClick = () => {
    this.props.onDoubleClick(this.props.photo)
  }

  _render() {
    return (
      <li
        className={cn(this.classes)}
        ref={this.setContainer}
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}>
        {this.renderThumbnail()}
      </li>
    )
  }

  static propTypes = {
    ...PhotoIterable.propTypes,

    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func
  }
}


module.exports = {
  PhotoTile: PhotoTile.wrap()
}
