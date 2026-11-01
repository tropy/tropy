import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'
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
          icon="Triangle"
          noFocus
          onClick={handleExpandButtonClick}/>
      )}
      <div className="icon-truncate">
        {typeof icon === 'string' ? <Icon name={icon}/> : icon}
      </div>
      {children}
    </div>
  )
}
