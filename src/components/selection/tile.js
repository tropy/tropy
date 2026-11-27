import { memo, useRef } from 'react'
import { useScrollIntoView } from '../../hooks/use-scroll-into-view.js'
import { useElementClicks } from '../../hooks/use-element-clicks.js'
import { Thumbnail } from '../photo/thumbnail.js'
import { pick } from '../../common/util.js'
import cx from 'classnames'

export const SelectionTile = memo(({
  direction,
  index,
  isActive,
  isDragging,
  isLast,
  isOver,
  onContextMenu,
  onItemOpen,
  onSelect,
  photo,
  selection,
  size = 512
}) => {
  let container = useRef()

  useScrollIntoView(container, { when: isActive })

  let elementClicks = useElementClicks({
    isSelected: isActive,
    onDoubleClick: onItemOpen,
    onSelect,
    value: selection
  })

  return (
    <li
      ref={container}
      data-index={index}
      className={cx({
        active: isActive,
        dragging: isDragging,
        last: isLast,
        over: isOver,
        selection: true,
        tile: true,
        [direction]: direction
      })}
      onContextMenu={(event) => onContextMenu(event, selection)}
      {...elementClicks}>
      <div className="tile-state">
        <Thumbnail
          {...pick(selection, Thumbnail.keys)}
          consolidated={photo.consolidated}
          color={photo.color}
          mimetype={photo.mimetype}
          size={size}/>
      </div>
    </li>
  )
})
