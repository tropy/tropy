import React from 'react'
import { Photo } from './photo'

export const Item = ({ item, hasOnlyNotes, ...props }) => (
  item.photos.map(photo =>
    (hasOnlyNotes && !photo.notes?.length) ?
      null :
        <Photo {...props} key={photo.id} item={item} photo={photo}/>)
)
