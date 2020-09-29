import React from 'react'
import { Photo } from './photo'
import { arrayOf, bool, object, shape, string } from 'prop-types'


export const Item = ({ item, hasOnlyNotes, ...props }) => (
  item.photos.map(photo =>
    (hasOnlyNotes && !photo.notes?.length) ?
      null :
      <Photo {...props} key={photo.id} item={item} photo={photo}/>)
)

Item.propTypes = {
  canOverflow: bool,
  hasPhotos: bool,
  hasMetadata: bool,
  hasNotes: bool,
  hasOnlyNotes: bool,
  cache: string,
  item: shape({
    photos: arrayOf(object).isRequired
  }).isRequired
}
