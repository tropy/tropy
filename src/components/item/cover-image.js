import React from 'react'
import { useSelector } from 'react-redux'
import { arrayOf, func, number } from 'prop-types'
import { Thumbnail } from '../photo/thumbnail.js'
import { TagColors } from '../tag/colors.js'
import { pick } from '../../common/util.js'

const StackLines = ({ count }) => (
  (count > 1) && (
    <div className="stack-lines">
      <div className="line line-2"/>
      <div className="line line-1"/>
    </div>
  ))

StackLines.propTypes = {
  count: number
}


export const CoverImage = React.memo(({ cover, photos, tags, ...props }) => {
  let id = cover || photos[0]
  let photo = useSelector(state => state.photos[id]) || {}

  return (
    <div className="cover-image">
      <StackLines count={photos.length}/>

      <Thumbnail
        {...props}
        {...pick(photo, Thumbnail.keys)}
        id={id}/>

      <TagColors tags={tags}/>
    </div>
  )
})

CoverImage.propTypes = {
  onClick: func,
  onContextMenu: func,
  onDoubleClick: func,
  onMouseDown: func,
  photos: arrayOf(number).isRequired,
  tags: arrayOf(number),
  cover: number,
  size: number
}
