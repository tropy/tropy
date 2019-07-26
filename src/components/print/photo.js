'use strict'

const React = require('react')
const { MetadataSection } = require('./metadata')
const { NoteList } = require('./note')
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


const Photo = ({ canOverflow, item, hasMetadata, hasNotes, photo }) => {
  let rotation = Rotation
    .fromExifOrientation(photo.orientation)
    .add(photo)

  return (
    <div className={cx('photo', 'container',
      o(photo.width < photo.height, rotation.isHorizontal),
      { overflow: canOverflow, metadata: hasMetadata || hasNotes })}>
      <div className="photo-container">
        <img
          className={`iiif rot-${rotation.format('x')}`}
          src={photo.path}/>
      </div>
      {hasMetadata &&
        <div className={cx('metadata-container')}>
          {item &&
            <div className="col">
              <MetadataSection
                title="print.item"
                fields={item.data}/>
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

const o = (isPortrait, isHorizontal) =>
  isPortrait ?
    (isHorizontal ? 'portrait' : 'landscape') :
    (isHorizontal ? 'landscape' : 'portrait')

module.exports = {
  Photo
}
