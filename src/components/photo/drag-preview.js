import React from 'react'
import { Thumbnail } from './thumbnail'
import cx from 'classnames'
import { arrayOf, number, shape, string } from 'prop-types'

export const PhotoDragPreview = ({ cache, size, items  }) => {
  let count = items.length

  return count > 0 && (
    <div className={cx('photo', 'drag-preview', 'center', {
      multiple: count > 1
    })}>
      <Thumbnail
        {...items[0]}
        cache={cache}
        size={size}/>
      {count > 1 && <div className="badge">{count}</div>}
    </div>
  )
}

PhotoDragPreview.propTypes = {
  cache: string.isRequired,
  size: number.isRequired,
  items: arrayOf(shape({
    id: number.isRequired
  })).isRequired
}

PhotoDragPreview.defaultProps = {
  size: 64
}
