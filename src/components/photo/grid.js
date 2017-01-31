'use strict'

const React = require('react')
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')


class PhotoGrid extends PhotoIterator {

  render() {
    return (
      <ul className="photo-grid">
        {this.map(props =>
          <PhotoTile {...props}
            key={props.photo.id}/>)}
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
