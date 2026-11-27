import { memo } from 'react'
import cx from 'classnames'
import { Thumbnail } from './thumbnail.js'
import { Icon } from '../icons.js'
import { TranscriptionIcon } from '../transcription/icon.js'
import { Button } from '../button.js'
import { useElementClicks } from '../../hooks/use-element-clicks.js'
import { pick } from '../../common/util.js'

export const PhotoTile = memo(({
  direction,
  index,
  isActive,
  isDragging,
  isExpandable,
  isExpanded,
  isLast,
  isMatch,
  isOver,
  isSelected,
  onConsolidate,
  onContextMenu,
  onItemOpen,
  onSelect,
  onToggle,
  photo,
  size = 512
}) => {
  let elementClicks = useElementClicks({
    isSelected: isActive,
    onDoubleClick: onItemOpen,
    onSelect,
    value: photo
  })

  return (
    <li
      data-index={index}
      className={cx('photo', 'tile', {
        active: isSelected,
        dragging: isDragging,
        expandable: isExpandable,
        match: isMatch,
        expanded: isExpanded,
        last: isLast,
        over: isOver,
        [direction]: direction
      })}>
      <div className="tile-state">
        <Thumbnail
          {...pick(photo, Thumbnail.keys)}
          size={size}
          onContextMenu={(event) => onContextMenu(event, photo)}
          {...elementClicks}/>
        {photo.broken && (
          <Button
            icon={<Icon name="WarningOverlay"/>}
            className="warning"
            title="photo.consolidate"
            onClick={() => onConsolidate(photo)}/>
        )}
        <div className="icon-container">
          {isExpandable && (
            <Button
              icon={<Icon name="SelectionOverlay"/>}
              onClick={() => onToggle(photo)}/>
          )}
          <TranscriptionIcon
            id={photo.transcriptions?.at(-1)}
            overlay/>
        </div>
      </div>
      {isExpanded && <div className="pointer"/>}
    </li>
  )
})
