'use strict'

const React = require('react')
const { MetadataSection } = require('./metadata')
const { ItemInfo } = require('../item/info')
const { PhotoInfo } = require('../photo/info')
const cx = require('classnames')
const { Rotation } = require('../../common/iiif')

const {
  arrayOf,
  bool,
  number,
  object,
  shape,
  string
} = require('prop-types')


const Photo = ({ photo, item }) => {
  let rotation = Rotation
    .fromExifOrientation(photo.orientation)
    .add(photo)

  return (
    <div className={
      classes(photo.width < photo.height, rotation.isHorizontal)
    }>
      <div className="photo-container">
        <img
          className={`iiif rot-${rotation.format('x')}`}
          src={photo.path}/>
      </div>
      <div className="metadata-container">
        {item &&
          <div className="col">
            <MetadataSection
              title="panel.metadata.item"
              fields={item.data}/>
            <ItemInfo item={item}/>
          </div>}
        <div className="col">
          <MetadataSection
            title="panel.metadata.photo"
            fields={photo.data}/>
          <PhotoInfo photo={photo}/>
        </div>
      </div>
    </div>
  )
}

Photo.propTypes = {
  item: object,
  photo: shape({
    angle: number.isRequired,
    data: arrayOf(object).isRequired,
    height: number.isRequired,
    mirror: bool.isRequired,
    orientation: number.isRequired,
    path: string.isRequired,
    width: number.isRequired
  })
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
