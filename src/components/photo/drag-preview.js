import cx from 'classnames'
import { Thumbnail } from './thumbnail.js'

export const PhotoDragPreview = ({
  item,
  size = 64
}) => {
  let count = 1
  let photo = item

  return (
    <div className={cx('photo', 'drag-preview', {
      multiple: count > 1
    })}>
      <Thumbnail
        {...photo}
        size={size}/>
      {count > 1 && <div className="badge">{count}</div>}
    </div>
  )
}
