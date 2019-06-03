'use strict'

const React = require('react')
const cx = require('classnames')
const { Rotation } = require('../../common/iiif')
const { bool, number, string } = require('prop-types')

const Photo = ({ angle, height, mirror, orientation, path, width }) => {
  let rotation = Rotation
    .fromExifOrientation(orientation)
    .add({ angle, mirror })

  return (
    <div className={classes(width < height, rotation.isHorizontal)}>
      <img
        className={`iiif rot-${rotation.format('x')}`}
        src={path}/>
    </div>
  )
}

Photo.propTypes = {
  angle: number.isRequired,
  height: number.isRequired,
  mirror: bool.isRequired,
  orientation: number.isRequired,
  path: string.isRequired,
  width: number.isRequired
}

const classes = (isPortrait, isHorizontal) => cx(
  'photo',
  'page',
  isPortrait ?
    (isHorizontal ? 'portrait' : 'landscape') :
    (isHorizontal ? 'landscape' : 'portrait')
)

module.exports = {
  Photo
}
