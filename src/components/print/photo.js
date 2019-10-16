'use strict'

const React = require('react')
const { MetadataSection } = require('./metadata')
const { NoteList } = require('./note')
const { ItemInfo } = require('../item/info')
const { PhotoInfo } = require('../photo/info')
const cx = require('classnames')
const { Rotation } = require('../../common/iiif')
const { Cache } = require('../../common/cache')
const { IMAGE } = require('../../constants')

const {
  arrayOf,
  bool,
  number,
  object,
  shape,
  string
} = require('prop-types')


const Photo = ({ canOverflow, item, hasMetadata, hasNotes, photo, cache }) => {
  let rotation = Rotation
    .fromExifOrientation(photo.orientation)
    .add(photo)

  return (
    <div className={cx('photo', 'container',
      rotation.mode(photo),
      { overflow: canOverflow, metadata: hasMetadata || hasNotes })}>
      <div className="photo-container">
        <img
          className={`iiif rot-${rotation.format('x')}`}
          loading="eager"
          src={source(photo, cache)}/>
      </div>
      {hasMetadata &&
        <div className={cx('metadata-container')}>
          {item &&
            <div className="col">
              <MetadataSection
                title="print.item"
                fields={item.data}
                tags={item.tags}/>
              <ItemInfo item={item}/>
            </div>}
          <div className="col">
            <MetadataSection
              title="print.photo"
              fields={photo.data}/>
            <PhotoInfo photo={photo}/>
            {hasNotes && !canOverflow &&
              <NoteList
                notes={photo.notes}
                heading="print.notes"/>}
          </div>
        </div>}
      {hasNotes && canOverflow &&
        <NoteList notes={photo.notes}/>}
    </div>
  )
}

Photo.propTypes = {
  canOverflow: bool,
  hasMetadata: bool,
  hasNotes: bool,
  item: object,
  cache: string,
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

const source = (photo, cache) =>
  (photo.protocol !== 'file' || !IMAGE.WEB[photo.mimetype]) ?
    Cache.url(cache, photo.id, 'full', photo.mimetype) :
    `${photo.protocol}://${photo.path}`

module.exports = {
  Photo
}
