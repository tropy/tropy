'use strict'

const React = require('react')
//const { PropTypes } = React
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')


class PhotoGrid extends PhotoIterator {

  render() {
    return (
      <ul className="photo-grid">
        {this.map(({ photo, ...props }) =>
          <PhotoTile {...props}
            key={photo.id}
            photo={photo}
            onClick={this.select}
            onDoubleClick={this.open}/>)}
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
