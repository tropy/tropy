import cx from 'classnames'
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
          onClick={onExpandButtonClick}/>
      )}
      <div className="icon-truncate">
        {typeof icon === 'string' ? <Icon name={icon}/> : icon}
      </div>
      {children}
    </div>
  )
}
