'use strict'

const React = require('react')
const { MetadataContainer } = require('./metadata')
const { NoteList } = require('./note')
const cx = require('classnames')
const { Rotation } = require('../../common/iiif')
const { Cache } = require('../../common/cache')

const {
  arrayOf,
  bool,
  number,
  object,
  shape,
  string
} = require('prop-types')


const Photo = ({
  canOverflow, item, hasPhotos, hasMetadata, hasNotes, photo, cache
}) => {
  let rotation = Rotation
    .fromExifOrientation(photo.orientation)
    .add(photo)

  return (
    <div className={cx('photo', 'container', rotation.mode(photo), {
      'overflow': canOverflow,
      'metadata': hasMetadata,
      'notes': hasNotes,
      'text-only': !hasPhotos
    })}>
      {hasPhotos &&
        <div className="photo-container">
          <img
            className={`iiif rot-${rotation.format('x')}`}
            decoding="sync"
            loading="eager"
            src={Cache.src(cache, photo)}/>
        </div>
      }
      {(hasMetadata || (hasNotes && !canOverflow)) &&
        <MetadataContainer
          item={hasMetadata ? item : null}
          photo={hasMetadata ? photo : null}
          notes={hasNotes && !canOverflow &&
            <NoteList notes={photo.notes}
              heading="print.notes"/>}/>}
      {hasNotes && canOverflow &&
        <NoteList notes={photo.notes}/>}
    </div>
  )
}

Photo.propTypes = {
  canOverflow: bool,
  hasPhotos: bool,
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

module.exports = {
  Photo
}
