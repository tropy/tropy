import cx from 'classnames'
import { useEvent } from '../../hooks/use-event'
import { Button } from '../button.js'
import { Icon } from '../icons.js'

export const NodeContainer = ({
  children,
  className,
  icon = 'Folder',
  onContextMenu,
  onClick,
  onExpandButtonClick,
  ref
}) => {
  let handleExpandButtonClick = useEvent(event => {
    event.stopPropagation()
    onExpandButtonClick()
  })

  return (
    <div
      ref={ref}
      className={cx('node-container', className)}
      onContextMenu={onContextMenu}
      onClick={onClick}>
      {onExpandButtonClick && (
        <Button
          icon="IconTriangle"
          noFocus
          onClick={handleExpandButtonClick}/>
      )}
      <div className="icon-truncate">
        <Icon name={icon}/>
      </div>
      {children}
    </div>
  )
}
