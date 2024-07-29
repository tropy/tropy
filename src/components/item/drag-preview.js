import cx from 'classnames'
import { CoverImage } from './cover-image.js'

export function ItemDragPreview({ item, size }) {
  let items = item.items
  let count = items.length

  let { cover, photos, tags } = items[0]

  return (
    <div className={cx('item', 'drag-preview', 'center', {
      multiple: count > 1
    })}>
      <CoverImage
        cover={cover}
        photos={photos}
        tags={tags}
        size={size}/>
      {count > 1 &&
        <div className="badge">{count}</div>}
    </div>
  )
}

ItemDragPreview.defaultProps = {
  size: 64
}
