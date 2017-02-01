'use strict'

const React = require('react')
//const { PropTypes } = React
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')


class PhotoGrid extends PhotoIterator {

  get placeholder() {
    return (
      <li className="photo-tile" style={{ flexBasis: `${this.size * 1.25}px` }}/>
    )
  }

  render() {
    const { tile } = this.placeholder

    return (
      <ul
        className="photo-grid"
        onClick={this.handleClickOutside}>
        {this.map(({ photo, ...props }) =>
          <PhotoTile {...props}
            key={photo.id}
            photo={photo}
            orientation="horizontal"/>)}

        {tile}{tile}{tile}{tile}{tile}{tile}{tile}
        {tile}{tile}{tile}{tile}{tile}{tile}{tile}
      </ul>
    )
  }


  static propTypes = {
    ...PhotoIterator.propTypes
  }
}

module.exports = {
  PhotoGrid
}
