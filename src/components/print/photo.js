'use strict'

const React = require('react')
const { MetadataSection } = require('./metadata')
const cx = require('classnames')
const { Rotation } = require('../../common/iiif')

const {
  arrayOf,
  bool,
  number,
  object,
  string
} = require('prop-types')


const Photo = ({ angle, data, height, mirror, orientation, path, width }) => {
  let rotation = Rotation
    .fromExifOrientation(orientation)
    .add({ angle, mirror })

  return (
    <div className={classes(width < height, rotation.isHorizontal)}>
      <div className="photo-container">
        <img
          className={`iiif rot-${rotation.format('x')}`}
          src={path}/>
      </div>
      <div className="metadata-container">
        <div className="col">
          <MetadataSection title="Item" fields={[]}/>
        </div>
        <div className="col">
          <MetadataSection title="Photo" fields={data}/>
        </div>
      </div>
    </div>
  )
}

Photo.propTypes = {
  angle: number.isRequired,
  data: arrayOf(object).isRequired,
  height: number.isRequired,
  mirror: bool.isRequired,
  orientation: number.isRequired,
  path: string.isRequired,
  width: number.isRequired
}

const classes = (isPortrait, isHorizontal) => cx(
  'photo',
  'page',
  'show-metadata',
  isPortrait ?
    (isHorizontal ? 'portrait' : 'landscape') :
    (isHorizontal ? 'landscape' : 'portrait')
)

module.exports = {
  Photo
}
