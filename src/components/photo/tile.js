'use strict'

const React = require('react')
//const { PropTypes } = React
const { PhotoIterable } = require('./iterable')
const cn = require('classnames')


class PhotoTile extends PhotoIterable {

  handleClick = () => {
    this.props.onSelect(this.props.photo)
  }

  handleDoubleClick = () => {
    this.props.onOpen(this.props.photo)
  }

  render() {
    return this.connect(
      <li
        className={cn(this.classes)}
        ref={this.setContainer}
        onClick={this.handleClick}
        onDoubleClick={this.handleDoubleClick}
        onContextMenu={this.handleContextMenu}>
        {this.renderThumbnail()}
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
