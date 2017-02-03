'use strict'

const React = require('react')
//const { PropTypes } = React
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')
const cn = require('classnames')


class PhotoGrid extends PhotoIterator {
  get classes() {
    return {
      ...super.classes,
      'photo-grid': true
    }
  }

  get placeholder() {
    return (
      <li
        className="placeholder tile"
        style={{ flexBasis: `${this.size * 1.25}px` }}/>
    )
  }

  render() {
    const tile = this.placeholder

    return this.connect(
      <ul
        className={cn(this.classes)}
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
  PhotoGrid: PhotoGrid.wrap()
}
