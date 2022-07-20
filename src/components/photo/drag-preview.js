import cx from 'classnames'
import { number, object } from 'prop-types'
import { Thumbnail } from './thumbnail.js'

export const PhotoDragPreview = ({ item, size  }) => {
  let count = 1
  let photo = item

  return (
    <div className={cx('photo', 'drag-preview', 'center', {
      multiple: count > 1
    })}>
      <Thumbnail
        {...photo}
        size={size}/>
      {count > 1 && <div className="badge">{count}</div>}
    </div>
  )
}

PhotoDragPreview.propTypes = {
  size: number.isRequired,
  item: object.isRequired
}

PhotoDragPreview.defaultProps = {
  size: 64
}
