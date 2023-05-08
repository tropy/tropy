import React from 'react'
import { MetadataContainer } from './metadata'
import { NoteList } from './note'
import cx from 'classnames'
import { Rotation, addOrientation } from '../../common/iiif'
import { Cache } from '../../common/cache'

import {
  arrayOf,
  bool,
  number,
  object,
  shape,
  string
} from 'prop-types'


export const Photo = ({
  canOverflow,
  item,
  hasPhotos,
  hasMetadata,
  hasNotes,
  photo,
  cache
}) => {
  Object.assign(photo, addOrientation(photo, photo, false))
  let rotation = new Rotation(photo)

  if (hasPhotos && !(hasMetadata || hasNotes)) {
    let [x, y] = rotation.ratio(photo)
    var ratio = { '--x': x, '--y': y }
  }

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
            className={photo.print ? null : `iiif rot-${rotation.format('x')}`}
            decoding="sync"
            loading="eager"
            src={photo.print || Cache.url(cache, 'full', photo)}
            style={ratio}/>
        </div>
      }
      {(hasMetadata || (hasNotes && !canOverflow)) &&
        <MetadataContainer
          item={hasMetadata ? item : null}
          photo={hasMetadata ? photo : null}
          notes={hasNotes && !canOverflow &&
            <NoteList
              notes={photo.notes}
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
